import { v4 } from "uuid";
import { ItemSelector } from "./ItemSelector";
import { encodeAI_backend } from "../../../../declarations/encodeAI_backend";

import {
  IndexItem,
  MetadataFilter,
  MetadataTypes,
  QueryResult,
} from "../../utils/types";
import { Principal } from "@dfinity/principal";
export interface CreateIndexConfig {
  version: number;
  apiKey: string;
  deleteIfExists?: boolean;
  metadata_config?: {
    indexed?: string[];
  };
  client?: any;
}

export interface CreateIndexOptions {
  apiKey: string;
}

/**
 * Local vector index instance.
 * @remarks
 * This class is used to create, update, and query a local vector index.
 * Each index is a folder on disk containing an index.json file and an optional set of metadata files.
 */
export class LocalIndex {
  private readonly _indexName: string | undefined;

  private _data?: IndexData;
  private _update?: IndexData;

  /**
   * Creates a new instance of LocalIndex.
   * @param folderPath Path to the index folder.
   * @param indexName Optional name of the index file. Defaults to index.json.
   */
  public constructor(indexName?: string) {
    this._indexName = indexName;
  }

  /**
   * Optional name of the index file.
   */
  public get indexName(): string | undefined {
    return this._indexName;
  }

  /**
   * Begins an update to the index.
   * @remarks
   * This method loads the index into memory and prepares it for updates.
   */
  public async beginUpdate(): Promise<void> {
    if (this._update) {
      throw new Error("Update already in progress");
    }

    await this.loadIndexData();
    if (this._data) {
      this._update = Object.assign({}, this._data);
    }
  }

  /**
   * Cancels an update to the index.
   * @remarks
   * This method discards any changes made to the index since the update began.
   */
  public cancelUpdate(): void {
    this._update = undefined;
  }

  public async deleteItem(id: string): Promise<void> {
    if (this._update) {
      const index = this._update.items.findIndex((i) => i.id === id);
      if (index >= 0) {
        this._update.items.splice(index, 1);
      }
    } else {
      await this.beginUpdate();
      const index = this._update!.items.findIndex((i) => i.id === id);
      if (index >= 0) {
        this._update!.items.splice(index, 1);
      }
      await this.endUpdate();
    }
  }

  /**
   * Ends an update to the index.
   * @remarks
   * This method saves the index to cannister.
   */
  public async endUpdate(): Promise<void> {
    if (!this._update) {
      throw new Error("No update in progress");
    }

    try {
      // Retrieve the canister ID
      const canisterId = (await encodeAI_backend.getPrincipal())[0];
      // Loop through all items in the update
      for (const item of this._update.items) {
        // Insert each vector to the canister
        console.log("item waiting to add", item);
        const vectorId = await encodeAI_backend.addVector(
          Principal.fromText(canisterId as string),
          item.metadata.documentId.toString(),
          item.id,
          BigInt(item.metadata.startPos),
          BigInt(item.metadata.endPos),
          item.vector
        );

        console.log("new vector id", vectorId);

        // Step 3: Handle successful publication
        if (vectorId) {
          console.log(
            "vector added to Cannister",
            canisterId,
            "new vector-id: ",
            vectorId
          );
          this._data = this._update;
          this._update = undefined;
        } else {
          throw new Error("Failed to publish index");
        }
      }
    } catch (err) {
      throw new Error(
        `Error commiting index to cannister: ${(err as Error).message}`
      );
    }
  }

  /**
   * Loads an index from disk and returns its stats.
   * @returns Index stats.
   */
  public async getIndexStats(apiKey: string): Promise<any> {
    await this.loadIndexData();
    return {
      metadata_config: this._data!.metadata_config,
      items: this._data!.items.length,
    };
  }

  /**
   * Returns an item from the index given its ID.
   * @param id ID of the item to retrieve.
   * @returns Item or undefined if not found.
   */
  public async getItem<TMetadata = Record<string, MetadataTypes>>(
    id: string,
    apiKey: string
  ): Promise<IndexItem<TMetadata> | undefined> {
    await this.loadIndexData();
    return this._data!.items.find((i) => i.id === id) as any | undefined;
  }

  /**
   * Adds an item to the index.
   * @remarks
   * A new update is started if one is not already in progress. If an item with the same ID
   * already exists, an error will be thrown.
   * @param item Item to insert.
   * @returns Inserted item.
   */
  public async insertItem<TMetadata = Record<string, MetadataTypes>>(
    item: Partial<IndexItem<TMetadata>>
  ): Promise<IndexItem<TMetadata>> {
    if (this._update) {
      return (await this.addItemToUpdate(item, true)) as any;
    } else {
      await this.beginUpdate();
      const newItem = await this.addItemToUpdate(item, true);
      await this.endUpdate();
      return newItem as any;
    }
  }

  /**
   * Returns true if the index exists.
   */

  public async isIndexCreated(
    indexName: any | undefined //principal
  ): Promise<boolean> {
    try {
      if (!indexName) {
        console.log("error, no index name or cannister principal given");
        return false;
      }

      const data = await encodeAI_backend.getIndexInfo(
        Principal.fromText(indexName)
      );

      if (data[0]) {
        return true;
      } else {
        false;
      }

      return false;
    } catch (err: unknown) {
      // Handle errors
      console.error("Error checking if index is created:", err);
      return false;
    }
  }

  /**
   * Returns all items in the index.
   * @remarks
   * This method loads the index into memory and returns all its items. A copy of the items
   * array is returned so no modifications should be made to the array.
   * @returns Array of all items in the index.
   */
  public async listItems<TMetadata = Record<string, MetadataTypes>>(): Promise<
    IndexItem<TMetadata>[]
  > {
    await this.loadIndexData();
    return this._data!.items.slice() as any;
  }

  /**
   * Returns all items in the index matching the filter.
   * @remarks
   * This method loads the index into memory and returns all its items matching the filter.
   * @param filter Filter to apply.
   * @returns Array of items matching the filter.
   */
  public async listItemsByMetadata<TMetadata = Record<string, MetadataTypes>>(
    filter: MetadataFilter
  ): Promise<IndexItem<TMetadata>[]> {
    await this.loadIndexData();
    return this._data!.items.filter((i) =>
      ItemSelector.select(i.metadata, filter)
    ) as any;
  }

  /**
   * Finds the top k items in the index that are most similar to the vector.
   * @remarks
   * This method loads the index into memory and returns the top k items that are most similar.
   * An optional filter can be applied to the metadata of the items.
   * @param vector Vector to query against.
   * @param topK Number of items to return.
   * @param filter Optional. Filter to apply.
   * @returns Similar items to the vector that matche the supplied filter.
   */
  public async queryItems<TMetadata = Record<string, MetadataTypes>>(
    vector: number[],
    topK: number,
    apiKey: string,
    filter?: MetadataFilter
  ): Promise<QueryResult<TMetadata>[]> {
    await this.loadIndexData();

    // Filter items
    let items = this._data!.items;
    if (filter) {
      items = items.filter((i) => ItemSelector.select(i.metadata, filter));
    }

    // Calculate distances
    const norm = ItemSelector.normalize(vector);
    const distances: { index: number; distance: number }[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const distance = ItemSelector.normalizedCosineSimilarity(
        vector,
        norm,
        item.vector,
        item.norm
      );
      distances.push({ index: i, distance: distance });
    }

    // Sort by distance DESCENDING
    distances.sort((a, b) => b.distance - a.distance);

    // Find top k
    const top: QueryResult<TMetadata>[] = distances.slice(0, topK).map((d) => {
      return {
        item: Object.assign({}, items[d.index]) as any,
        score: d.distance,
      };
    });

    return top;
  }

  /**
   * Adds or replaces an item in the index.
   * @remarks
   * A new update is started if one is not already in progress. If an item with the same ID
   * already exists, it will be replaced.
   * @param item Item to insert or replace.
   * @returns Upserted item.
   */
  public async upsertItem<TMetadata = Record<string, MetadataTypes>>(
    item: Partial<IndexItem<TMetadata>>,
    apiKey: string
  ): Promise<IndexItem<TMetadata>> {
    if (this._update) {
      return (await this.addItemToUpdate(item, false)) as any;
    } else {
      await this.beginUpdate();
      const newItem = await this.addItemToUpdate(item, false);
      await this.endUpdate();
      return newItem as any;
    }
  }

  /**
   * Ensures that the index has been loaded into memory.
   */

  protected async loadIndexData(): Promise<void> {
    if (!this._data && !this._indexName) {
      console.error("data is not there");
      return;
    }

    if (!(await this.isIndexCreated(this._indexName))) {
      throw new Error("Index does not exist or is empty");
    }

    try {
      const cannisterId: any = this._indexName;

      if (!cannisterId) {
        console.log("no cannister id not found");
        return;
      }
      //return and reconstruct vectors

      const vectors = await encodeAI_backend.getVectors(
        Principal.fromText(cannisterId)
      );
      if (!vectors[0]) {
        console.log("no vectors found", vectors);
        return;
      }
      console.log("index data", vectors[0]);

      if (vectors[0]) {
        const result = vectors[0].items;
        if (result.length > 0) {
          this._data = {
            cannisterId: cannisterId,
            items: [
              {
                id: result[0].vectorId,
                metadata: {
                  documentId: result[0].documentId,
                  startPos: Number(result[0].startPos),
                  endPos: Number(result[0].startPos),
                },
                vector: result[0].vector,
                norm: 0, //add this to vector-data on chain
              },
            ],
          };
        } else {
          this._data = {
            cannisterId: cannisterId,
            items: [],
          };
        }
      }
    } catch (error) {
      console.error("Error loading index data:", error);
      throw new Error("Failed to load index data");
    }
  }

  private async addItemToUpdate(
    item: Partial<IndexItem<any>>,
    unique: boolean
  ): Promise<IndexItem> {
    // Ensure vector is provided
    if (!item.vector) {
      throw new Error("Vector is required");
    }

    // Ensure unique
    const id = item.id ?? v4();

    if (unique) {
      const existing = (this._update?.items || []).find(
        (i) => i.id && i.id === id
      );
      if (existing) {
        throw new Error(`Item with id ${id} already exists`);
      }
    }

    // Check for indexed metadata
    let metadata: Record<string, any> = {};
    let metadataFile: string | undefined;
    if (this._update && item.metadata) {
      metadata = item.metadata;
    } else if (item.metadata) {
      metadata = item.metadata;
    }

    // Create new item
    const newItem: IndexItem = {
      id: id,
      metadata: metadata,
      vector: item.vector,
      norm: ItemSelector.normalize(item.vector),
    };

    // Add item to index
    if (!unique) {
      const existing = (this._update?.items || []).find(
        (i) => i.id && i.id === id
      );
      if (existing) {
        existing.metadata = newItem.metadata;
        existing.vector = newItem.vector;
        existing.metadataFile = newItem.metadataFile;
        return existing;
      } else {
        this._update?.items.push(newItem);
        console.log("this item was added", newItem);
        return newItem;
      }
    } else {
      this._update?.items.push(newItem);
      console.log("this item was added", newItem);
      //return here to ensure that item is updated
      return newItem;
    }
  }
}

interface IndexData {
  cannisterId: string;
  metadata_config?: {
    indexed?: string[];
  };
  items: IndexItem[];
}
