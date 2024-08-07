## Clanopedia - Encode Web3_AI

`Project is in development and  updates have breaking changes`

### Overview

This project allows AI models to retrieve vectors indexed on-chain in ICP canisters. The data is controlled by a DAO governance mechanism, ensuring a decentralized and tamper-proof process for adding and retrieving vectors.

### Features

1. **Vector Storage and Retrieval**:

   - AI models can call `getVectors` to retrieve stored vectors.
   - Vectors are securely stored on-chain, and similarity queries can be performed with the embedding of a given prompt.

2. **Decentralized Governance**:

   - To add or update a new vector, an "add document" proposal is created.
   - Token holders of the `dip20votes` token can vote on proposals.
   - The default voting threshold is set to 1 vote for this demo.
   - Minting of `dip20votes` tokens is also free for this demo.

3. **Backend Integration**:
   - The backend canister converts text documents into vector embeddings by sending an HTTP outcall to an openAI endpoint set up for embedding.
   - Once a proposal meets the vote threshold and is approved, anyone can add the vector representations to the canister and close the corresponding proposal.

#### Governance and Token Functions

- **Deploy DIP20 Token**:

  ```motoko
  public shared func deployDIP20() : async Principal;
  ```

- **Get DIP20 Token Principal**:

  ```motoko
  public query func getDIP20Principal() : async ?Principal;
  ```

- **Mint Token**:

  ```motoko
  public shared (msg) func mintToken() : async TxReceipt;
  ```

- **Create Proposal**:

  ```motoko
  private func _createProposal(method : Text, documentId : Text, threshold : Nat, caller : Principal) : async Nat;
  ```

- **Get Proposals**:

  ```motoko
  public shared (_) func getProposals() : async [{
      id : Nat;
      proposer : Principal;
      documentID : Text;
      method : Text;
      threshold : Nat;
  }];
  ```

- **Vote on Proposal**:

  ```motoko
  public shared (msg) func vote(proposalId : Nat, support : Bool) : async ();
  ```

- **Close Proposal**:

  ```motoko
  public shared func closeProposal(proposalId : Nat) : async ();
  ```

- **Get Proposal Status**:
  ```motoko
  public shared func getProposalStatus(proposalId : Nat) : async {
      status : ?DIP20Votes.ProposalState;
  };
  ```

#### Document and Vector Management

- **Add Document**:

  ```motoko
  public shared (msg) func addDocument(title : Text, content : Text) : async ?(Principal, Text, Nat);
  ```

- **Add Vector**:

  ```motoko
  public func addVector(cid : Principal, docID : Text, vectorId : Text, start : Nat, end : Nat, vector : [Float]) : async ?Text;
  ```

- **Get Vector Chunks**:

  ```motoko
  public func getVectors(cid : Principal) : async ?{ items : [VectorData] };
  ```

- **Get Document Chunks**:

  ```motoko
  public func getChunks(documentID : FileId, cid : Principal) : async ?Text;
  ```

- **Get Specific Chunk**:

  ```motoko
  public func getChunk(fileId : FileId, chunkNum : Nat, cid : Principal) : async ?Text;
  ```

- **Get Index Info**:

  ```motoko
  public func getIndexInfo(cid : Principal) : async ?[FileInfo];
  ```

- **Get Document ID by Vector ID**:

  ```motoko
  public shared func getDocumentID(vectorId : Text, cid : Principal) : async ?Text;
  ```

- **Get Document ID by Title**:

  ```motoko
  public shared func titleToDocumentID(title : Text) : async ?Text;
  ```

- **Get Document Title by Document ID**:
  ```motoko
  public shared func documentIDToTitle(documentID : Text) : async ?Text;
  ```

#### HTTP Outcall for Embeddings

- **Create Embeddings**:
  ```motoko
  public func createEmbeddings(words : Text) : async Text;
  ```

### Notes

- The provided functions are for demo purposes; additional error handling and security measures may be required for production use.

### Author

- [acgodson]()

### References
