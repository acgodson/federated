import Error "mo:base/Error";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Buckets "./Buckets";
import Types "./Types"

shared ({ caller = owner }) actor class AgentTemplate() = this {
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

  public type canister_id = Principal;
  private let threshold = 2147483648; //  ~2GB
  private let canisters : [var ?CanisterState<Bucket, Nat>] = Array.init(10, null);
  private let cycleShare = 500_000_000_000;

  // we could get document id from uri

  public func addDocument(
    //document information
    title : Text,
    content : Text,

  ) : async ?Text {
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
    let bucket = await getEmptyBucket(textSize);
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
        return ?docID;
      };
    };
  };

  public func addVector(
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
    let maybeBucket : ?Bucket = await getBucket(cid);
    switch (maybeBucket) {
      case (null) { throw Error.reject("Failed to get bucket") };
      case (?b) {
        let _ = await b.putVector(vectorData);
        return ?vectorId;
      };
    };

  };

  public func getAllVectors(cid : Principal) : async ?{ items : [VectorData] } {
    do ? {
      let b : Bucket = (await getBucket(cid))!;
      let vectorList = await b.getAllVectors();
      return ?vectorList;
    };
  };

  public func getFileInfo(cid : Principal) : async ?[FileInfo] {
    do ? {
      let b : Bucket = (await getBucket(cid))!;
      let fileInfoList = await b.getTextInfo();
      return ?fileInfoList;
    };
  };

  public func getDocumentChunks(documentID : FileId, cid : Principal) : async ?Text {
    let fileInfo = await getFileInfo(cid);
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
              let chunk = await getFileChunk(documentID, chunkNum, cid);
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

  // get file chunk
  public func getFileChunk(fileId : FileId, chunkNum : Nat, cid : Principal) : async ?Text {
    do ? {
      let b : Bucket = (await getBucket(cid))!;
      return await b.getChunks(fileId, chunkNum);

    };
  };

  // get a list of files from all canisters
  public func getAllFiles() : async [FileData] {
    let buff = Buffer.Buffer<FileData>(0);
    for (i in Iter.range(0, canisters.size() - 1)) {
      let c : ?CanisterState<Bucket, Nat> = canisters[i];
      switch c {
        case null {};
        case (?c) {
          let bi = await c.bucket.getTextInfo();
          for (j in Iter.range(0, bi.size() - 1)) {
            buff.add(bi[j]);
          };
        };
      };
    };
    Buffer.toArray(buff);
  };

  private func newEmptyBucket() : async Bucket {
    Cycles.add<system>(cycleShare);
    let b = await Buckets.Bucket();
    let s = await b.getSize();
    Debug.print("new canister principal is " # debug_show (Principal.toText(Principal.fromActor(b))));
    Debug.print("initial size is " # debug_show (s));
    var v : CanisterState<Bucket, Nat> = {
      bucket = b;
      var size = s;
    };

    var foundSlot = false;
    var i = 0;
    while (i < canisters.size() and foundSlot == false) {
      if (Option.isNull(canisters[i])) {
        canisters[i] := ?v;
        foundSlot := true;
      };
      i := i + 1;
    };

    if (foundSlot == false) {
      canisters[0] := ?v;
    };

    return b;
  };

  private func getEmptyBucket(s : Nat) : async Bucket {
    let cs : ?(?CanisterState<Bucket, Nat>) = Array.find<?CanisterState<Bucket, Nat>>(
      Array.freeze(canisters),
      func(cs : ?CanisterState<Bucket, Nat>) : Bool {
        switch (cs) {
          case null { false };
          case (?cs) {
            Debug.print("found canister with principal..." # debug_show (Principal.toText(Principal.fromActor(cs.bucket))));
            // calculate if there is enough space in canister for the new file.
            cs.size + s < threshold;
          };
        };
      },
    );
    let eb : ?Bucket = do ? {
      let c = cs!;
      let nb : ?Bucket = switch (c) {
        case (?c) { ?(c.bucket) };
        case _ { null };
      };

      nb!;
    };
    let c : Bucket = switch (eb) {
      case null { await newEmptyBucket() };
      case (?eb) { eb };
    };
    c;
  };

  private func sliceText(text : Text, start : Nat, end : Nat) : Text {
    var slicedText = "";
    var i = start;
    while (Nat.less(i, end)) {
      let char = Text.fromChar(Text.toArray(text)[i]);
      slicedText := Text.concat(slicedText, char);
      i := Nat.add(i, 1);
    };
    slicedText;
  };

  func getBucket(cid : Principal) : async ?Bucket {
    let cs : ?(?CanisterState<Bucket, Nat>) = Array.find<?CanisterState<Bucket, Nat>>(
      Array.freeze(canisters),
      func(cs : ?CanisterState<Bucket, Nat>) : Bool {
        switch (cs) {
          case null { false };
          case (?cs) {
            Debug.print("found canister with principal..." # debug_show (Principal.toText(Principal.fromActor(cs.bucket))));
            Principal.equal(Principal.fromActor(cs.bucket), cid);
          };
        };
      },
    );
    let bucket : ?Bucket = do ? {
      let c = cs!;
      let nb : ?Bucket = switch (c) {
        case (?c) { ?(c.bucket) };
        case _ { null };
      };

      nb!;
    };
    return bucket;
  };

  public shared ({ caller = _ }) func wallet_receive() : async () {
    ignore Cycles.accept<system>(Cycles.available());
  };
};
