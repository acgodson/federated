// # Buckets.mo

import Cycles "mo:base/ExperimentalCycles";

import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Random "mo:base/Random";
import Nat8 "mo:base/Nat8";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Buffer "mo:base/Buffer";
import Blob "mo:base/Blob";

import Prim "mo:prim";
import Map "mo:map/Map";
import { thash } "mo:map/Map";

import Types "../Utils/Types";


actor class Bucket() = this {

    type FileId = Types.FileId;
    type FileInfo = Types.FileInfo;
    type FileData = Types.FileData;
    type ChunkId = Types.ChunkId;
    type VectorData = Types.VectorData;
    type State = Types.State;
    var state = Types.empty();

    let limit = 20_000_000_000_000;

    private var vectorIdToDocId : Map.Map<Text, Text> = Map.new<Text, Text>();
    //save doc against principal just in case

    public func getSize() : async Nat {
        Debug.print("canister balance: " # Nat.toText(Cycles.balance()));
        Prim.rts_memory_size();
    };

    // Function to generate a random ID
    public func generateRandom(name : Text) : async Text {
        var n : Text = name;
        let entropy = await Random.blob();
        var f = Random.Finite(entropy);
        let count : Nat = 2;
        var i = 1;
        label l loop {
            if (i >= count) break l;
            let b = f.byte();
            switch (b) {
                case (?byte) { n := n # Nat8.toText(byte); i += 1 };
                case null {
                    let entropy = await Random.blob();
                    f := Random.Finite(entropy);
                };
            };
        };
        n;
    };

    // Function to create file info
    private func createFileInfo(fileId : Text, fi : FileInfo) : ?FileId {
        switch (Map.get(state.files, thash, fileId)) {
            case (?_) { /* error -- ID already taken. */ return null };
            case null {
                /* ok, not taken yet. */
                Debug.print("id is..." # debug_show (fileId));
                let _fileInfo = {
                    fileId = fileId;
                    name = fi.name;
                    chunkCount = fi.chunkCount;
                    size = fi.size;
                };
                ignore Map.put(state.files, thash, fileId, _fileInfo);
                ?fileId;
            };
        };
    };

    // Function to update mappings
    private func updateFileInfo(docId : FileId, vectorId : Text) {
        switch (Map.get(state.files, thash, docId)) {
            case null {};
            case (?idx) {
                let updatedVectorIdToDocId = Map.clone(vectorIdToDocId);
                ignore Map.put(updatedVectorIdToDocId, thash, vectorId, docId);
                vectorIdToDocId := updatedVectorIdToDocId;

            };
        };
    };

    // Function to store a text
    public func putText(fi : FileInfo) : async ?FileId {
        do ? {
            let fileId = await generateRandom(fi.name);
            createFileInfo(fileId, fi)!;
        };
    };

    func chunkId(fileId : FileId, chunkNum : Nat) : ChunkId {
        fileId # (Nat.toText(chunkNum));
    };

    public func putChunks(fileId : FileId, chunkNum : Nat, chunkData : Blob) : async ?() {
        do ? {
            Debug.print("generated chunk id is " # debug_show (chunkId(fileId, chunkNum)) # "from" # debug_show (fileId) # "and " # debug_show (chunkNum) # "  and chunk size..." # debug_show (Blob.toArray(chunkData).size()));
            ignore Map.put(
                state.chunks,
                thash,
                chunkId(fileId, chunkNum),
                chunkData,
            );

        };
    };

    //Functiom to add vector to state
    public func putVector(data : VectorData) : async ?() {
        let existingVector = Map.get(state.vectors, thash, data.vectorId);
        switch (existingVector) {
            case (null) {
                // Vector does not exist, so add it
                let vectorData = {
                    vectorId = data.vectorId;
                    documentId = data.documentId;
                    startPos = data.startPos;
                    endPos = data.endPos;
                    vector = data.vector;
                };
                do ? {
                    ignore Map.put(
                        state.vectors,
                        thash,
                        data.vectorId,
                        vectorData,
                    );
                    updateFileInfo(data.documentId, data.vectorId);
                };
            };
            case (?_) {
                return null;
            };
        };
    };

    public query func getAllVectors() : async { items : [VectorData] } {
        let transformedVectorDataList = Map.toArrayMap<Text, VectorData, VectorData>(
            state.vectors,
            func(_, d) {
                ?{
                    vectorId = d.vectorId;
                    documentId = d.documentId;
                    startPos = d.startPos + 100;
                    endPos = d.endPos + 100;
                    vector = d.vector;
                };
            },
        );
        { items = transformedVectorDataList };
    };

    func getFileInfoData(fileId : FileId) : ?FileData {
        do ? {
            let v = Map.get(state.files, thash, fileId)!;
            {
                fileId = v.fileId;
                name = v.name;
                size = v.size;
                chunkCount = v.chunkCount;
            };
        };
    };

    public query func getFileInfo(fileId : FileId) : async ?FileData {
        do ? {
            getFileInfoData(fileId)!;
        };
    };

    public query func getChunks(fileId : FileId, chunkNum : Nat) : async ?Text {
        do ? {
            let blob = Map.get(state.chunks, thash, chunkId(fileId, chunkNum));
            return Text.decodeUtf8(blob!);
        };
    };

    public query func getTextInfo() : async [FileData] {
        let b = Buffer.Buffer<FileData>(0);
        let _ = do ? {
            for (
                (f, _) in Map.entries(state.files)
            ) {
                b.add(getFileInfoData(f)!);
            };
        };
        Buffer.toArray(b);
    };

    public query func vectorIDToDocumentID(vectorId : Text) : async ?Text {

        do ? {
            let v = Map.get(vectorIdToDocId, thash, vectorId)!;
            return ?v;
        };
    };

    public func wallet_receive() : async { accepted : Nat64 } {
        let available = Cycles.available();
        let accepted = Cycles.accept<system>(Nat.min(available, limit));
        { accepted = Nat64.fromNat(accepted) };
    };

    public func wallet_balance() : async Nat {
        return Cycles.balance();
    };

};
