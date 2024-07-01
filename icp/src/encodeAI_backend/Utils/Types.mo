import Map "mo:map/Map";
import Time "mo:base/Time";
import P "mo:base/Prelude";

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
        startPos : Int;
        endPos : Int;
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

    /// Update call operations
    public type Operation = {
        #mint;
        #burn;
        #transfer;
        #transferFrom;
        #approve;
    };
    public type TransactionStatus = {
        #succeeded;
        #inprogress;
        #failed;
    };
    /// Update call operation record fields
    public type TxRecord = {
        caller : ?Principal;
        op : Operation;
        index : Nat;
        from : Principal;
        to : Principal;
        amount : Nat;
        fee : Nat;
        timestamp : Time.Time;
        status : TransactionStatus;
    };

    public func unwrap<T>(x : ?T) : T = switch x {
        case null { P.unreachable() };
        case (?x_) { x_ };
    };
};
