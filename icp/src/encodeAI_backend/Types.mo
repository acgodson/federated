import Map "mo:map/Map";

module Types {
    public type FileId = Text;
    public type VectorId = Text;
    public type ChunkId = Text;
    public type FileInfo = {
        fileId : Text;
        name : Text;
        chunkCount : Nat;
        size : Nat;
    };
    public type FileData = {
        fileId : FileId;
        name : Text;
        chunkCount : Nat;
        size : Nat;
    };

    public type VectorData = {
        vectorId : Text; //gotten off chain
        documentId : FileId;
        startPos : Nat;
        endPos : Nat;
        vector : [Float];
    };
    public type State = {
        files : Map.Map<FileId, FileInfo>;
        chunks : Map.Map<ChunkId, Blob>;
        vectors : Map.Map<VectorId, VectorData>;
    };

    public func empty() : State {
        {
            files = Map.new<FileId, FileInfo>();
            chunks = Map.new<ChunkId, Blob>();
            vectors = Map.new<VectorId, VectorData>();
        };
    };

   public type TextChunk = {
        text : Text;
        startPos : Nat;
        endPos : Nat;
    };
};
