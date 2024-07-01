// # Storage.mo
import Error "mo:base/Error";
import Principal "mo:base/Principal";

import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Iter "mo:base/Iter";

import Buckets "./Buckets";
import { sliceText; getEmptyBucket; getBucket } "../Utils/Utility";
import Types "../Utils/Types";

module {
    type Bucket = Buckets.Bucket;
    type FileId = Types.FileId;
    type FileInfo = Types.FileInfo;
    type FileData = Types.FileData;
    type TextChunk = Types.TextChunk;
    type VectorData = Types.VectorData;
    type CanisterState<Bucket, Nat> = {
        bucket : Bucket;
        var size : Nat;
    };

    public func addDocument(
        canisters : [var ?CanisterState<Bucket, Nat>],
        title : Text,
        content : Text,
        // threshold : Nat,
        // cycleShare : Nat,
    ) : async (?Principal, ?Text) {
        let chunkSize = 1024;
        let textSize = Text.size(content);
        // Ensure proper handling of Nat and Int conversion to avoid traps
        let chunkCount = if (textSize == 0) 0 else {
            let textSizeInt = textSize;
            let chunkSizeInt = chunkSize;
            let sum = Nat.add(textSizeInt, chunkSizeInt);
            let chunkCountInt = Nat.div(Nat.sub(sum, 1), chunkSizeInt);
            chunkCountInt;
        };
        // FileInfo
        let _fileInfo = {
            fileId = "";
            name = title;
            chunkCount = chunkCount;
            size = textSize;
        };
        let bucket = await getEmptyBucket(canisters, textSize);
        let documentID = await bucket.putText(_fileInfo);
        switch (documentID) {
            case (null) { throw Error.reject("Failed to store document") };
            case (?docID) {
                var i : Nat = 0;
                //save document content/chunks to bucket
                while (Nat.less(i, chunkCount)) {
                    let start = Nat.mul(i, chunkSize);
                    let end = Nat.min(Nat.mul(Nat.add(i, 1), chunkSize), textSize);
                    let chunkData = sliceText(content, start, end);
                    let chunkBlob = Text.encodeUtf8(chunkData);
                    let _ = await bucket.putChunks(docID, i, chunkBlob);
                    i := Nat.add(i, 1);
                };
                // Return the canister ID instead of document ID
                let canisterID = Principal.fromActor(bucket);
                return (?canisterID, ?docID);
            };
        };
    };

    public func addVector(
        canisters : [var ?CanisterState<Bucket, Nat>],
        cid : Principal,
        docID : Text,
        vectorId : Text,
        start : Nat,
        end : Nat,
        vector : [Float],
    ) : async ?Text {
        let vectorData = {
            vectorId = vectorId;
            documentId = docID;
            startPos = start;
            endPos = end;
            vector = vector;
        };
        let maybeBucket : ?Bucket = await getBucket(canisters, cid);
        switch (maybeBucket) {
            case (null) { throw Error.reject("Failed to get bucket") };
            case (?b) {
                let _ = await b.putVector(vectorData);
                return ?vectorId;
            };
        };
    };

    public func getPrincipal(canisters : [var ?CanisterState<Buckets.Bucket, Nat>]) : async ?Text {
        if (canisters.size() == 0) {
            return null;
        };

        var i = canisters.size();
        while (i > 0) {
            i -= 1;
            switch (canisters[i]) {
                case null {};
                case (?c) {
                    return ?Principal.toText(Principal.fromActor(c.bucket));
                };
            };
        };
        return null;
    };

    public func getVectors(canisters : [var ?CanisterState<Buckets.Bucket, Nat>], cid : Principal) : async ?{
        items : [Types.VectorData];
    } {
        let maybeBucket = await getBucket(canisters, cid);
        switch (maybeBucket) {
            case null { return null };
            case (?bucket) {
                let vectorList = await bucket.getAllVectors();
                return ?vectorList;
            };
        };
    };

    public func getChunks(canisters : [var ?CanisterState<Buckets.Bucket, Nat>], documentID : FileId, cid : Principal) : async ?Text {
        let fileInfo = await getIndexInfo(canisters, cid);
        switch (fileInfo) {
            case (?fileInfoList) {
                let documentInfo = Array.find(
                    fileInfoList,
                    func(info : FileInfo) : Bool {
                        info.fileId == documentID;
                    },
                );
                switch (documentInfo) {
                    case (?docInfo) {
                        var text = "";
                        for (chunkNum in Iter.range(0, docInfo.chunkCount - 1)) {
                            let chunk = await getChunk(canisters, documentID, chunkNum, cid);
                            switch (chunk) {
                                case (?chunkText) {
                                    text := text # chunkText;
                                };
                                case null {};
                            };
                        };
                        return ?text;
                    };
                    case null { return null };
                };
            };
            case null { return null };
        };
    };

    public func getChunk(canisters : [var ?CanisterState<Buckets.Bucket, Nat>], fileId : Types.FileId, chunkNum : Nat, cid : Principal) : async ?Text {
        let maybeBucket = await getBucket(canisters, cid);
        switch (maybeBucket) {
            case null { return null };
            case (?bucket) {
                return await bucket.getChunks(fileId, chunkNum);
            };
        };
    };

    public func getIndexInfo(canisters : [var ?CanisterState<Buckets.Bucket, Nat>], cid : Principal) : async ?[Types.FileInfo] {
        let maybeBucket = await getBucket(canisters, cid);
        switch (maybeBucket) {
            case null { return null };
            case (?bucket) {
                let fileInfoList = await bucket.getTextInfo();
                return ?fileInfoList;
            };
        };
    };

    public func getDocumentID(canisters : [var ?CanisterState<Buckets.Bucket, Nat>], vectorId : Text, cid : Principal) : async ?Text {
        let maybeBucket = await getBucket(canisters, cid);
        switch (maybeBucket) {
            case null { return null };
            case (?bucket) {
                return await bucket.vectorIDToDocumentID(vectorId);
            };
        };
    };

    public func titleToDocumentID(canisters : [var ?CanisterState<Bucket, Nat>], title : Text) : async ?Text {
        for (canister in canisters.vals()) {
            switch (canister) {
                case (?c) {
                    let fileInfoList = await c.bucket.getTextInfo();
                    for (fileInfo in fileInfoList.vals()) {
                        if (fileInfo.name == title) {
                            return ?fileInfo.fileId;
                        };
                    };
                };
                case null {};
            };
        };
        return null;
    };

    public func documentIDToTitle(canisters : [var ?CanisterState<Bucket, Nat>], documentID : Text) : async ?Text {
        for (canister in canisters.vals()) {
            switch (canister) {
                case (?c) {
                    let fileInfoList = await c.bucket.getTextInfo();
                    for (fileInfo in fileInfoList.vals()) {
                        if (fileInfo.fileId == documentID) {
                            return ?fileInfo.name;
                        };
                    };
                };
                case null {};
            };
        };
        return null;
    };

    // func generateUUID() : Text {
    //     "UUID-123456789";
    // };
};
