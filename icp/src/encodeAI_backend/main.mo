import Error "mo:base/Error";
import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";

import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Blob "mo:base/Blob";

import DAO "./DAO";
import Storage "./Storage";

import Buckets "./Buckets";
import DIP20Token "./DIP20";
import DIP20Votes "./DIP20Votes";
import Types "./Types";
import HTTPTypes "./HTTPTypes";

shared ({ caller = owner }) actor class Main() {
    type Bucket = Buckets.Bucket;
    type DIP20Token = DIP20Token.DIP20Token;
    type Proposal = DIP20Votes.Proposal;
    type TxReceipt = DIP20Votes.TxReceipt;
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

    private stable var dip20Canister : ?DIP20Token = null;
    private let canisters : [var ?CanisterState<Bucket, Nat>] = Array.init(10, null);
    private let cycleShare = 1_000_000_000_000;

    //////////////////////////////////////////////////////////////////////////////
    // DAO Token and Governance
    ///////////////////////////////////////////////////////////////////////////////

    public shared func deployDIP20() : async Principal {
        let canister = await DAO.deployDIP20(cycleShare);
        dip20Canister := ?canister;
        return DAO.getDIP20Principal(canister);
    };

    public query func getDIP20Principal() : async ?Principal {
        switch (dip20Canister) {
            case (?canister) { return ?DAO.getDIP20Principal(canister) };
            case null { return null };
        };
    };

    public shared (msg) func mintToken() : async TxReceipt {
        switch (dip20Canister) {
            case (?canister) {
                return await DAO.mintToken(canister, msg.caller);
            };
            case null { throw Error.reject("DIP20 token not deployed.") };
        };
    };

    public shared (msg) func createProposal(method : Text, args : [Blob], threshold : Nat) : async Nat {
        switch (dip20Canister) {
            case (?canister) {
                return await DAO.createProposal(canister, msg.caller, method, args, threshold);
            };
            case null { throw Error.reject("DIP20 token not deployed.") };
        };
    };

    public shared (msg) func vote(proposalId : Nat, support : Bool) : async () {
        switch (dip20Canister) {
            case (?canister) {
                await DAO.vote(canister, msg.caller, proposalId, support);
            };
            case null { throw Error.reject("DIP20 token not deployed.") };
        };
    };

    public shared func closeProposal(proposalId : Nat) : async () {
        switch (dip20Canister) {
            case (?canister) {
                ignore await DAO.closeProposal(canister, proposalId);
            };
            case null { throw Error.reject("DIP20 token not deployed.") };
        };
    };

    public shared func getProposalStatus(proposalId : Nat) : async {
        status : ?DIP20Votes.ProposalState;
    } {
        switch (dip20Canister) {
            case (?canister) {
                return {
                    status = await DAO.getProposalStatus(canister, proposalId);
                };
            };
            case null { throw Error.reject("DIP20 token not deployed.") };
        };
    };

    //////////////////////////////////////////////////////////////////////////////
    // Decentralized Storage
    ///////////////////////////////////////////////////////////////////////////////

    public func addDocument(title : Text, content : Text) : async (?Principal, ?Text) {
        return await Storage.addDocument(canisters, title, content);
    };

    public func addVector(cid : Principal, docID : Text, vectorId : Text, start : Nat, end : Nat, vector : [Float]) : async ?Text {
        return await Storage.addVector(canisters, cid, docID, vectorId, start, end, vector);
    };

    public shared func getPrincipal() : async ?Text {
        return await Storage.getPrincipal(canisters);
    };

    public func getVectors(cid : Principal) : async ?{ items : [VectorData] } {
        return await Storage.getVectors(canisters, cid);
    };

    public func getChunks(documentID : FileId, cid : Principal) : async ?Text {
        return await Storage.getChunks(canisters, documentID, cid);
    };

    public func getChunk(fileId : FileId, chunkNum : Nat, cid : Principal) : async ?Text {
        return await Storage.getChunk(canisters, fileId, chunkNum, cid);
    };

    public func getIndexInfo(cid : Principal) : async ?[FileInfo] {
        return await Storage.getIndexInfo(canisters, cid);
    };

    public shared func getDocumentID(vectorId : Text, cid : Principal) : async ?Text {
        return await Storage.getDocumentID(canisters, vectorId, cid);
    };

    public shared func titleToDocumentID(title : Text) : async ?Text {
        return await Storage.titleToDocumentID(canisters, title);
    };

    public shared func documentIDToTitle(documentID : Text) : async ?Text {
        return await Storage.documentIDToTitle(canisters, documentID);
    };

    //function to transform the response
    public query func transform(raw : HTTPTypes.TransformArgs) : async HTTPTypes.CanisterHttpResponsePayload {
        let transformed : HTTPTypes.CanisterHttpResponsePayload = {
            status = raw.response.status;
            body = raw.response.body;
            headers = [
                {
                    name = "Content-Security-Policy";
                    value = "default-src 'self'";
                },
                { name = "Referrer-Policy"; value = "strict-origin" },
                { name = "Permissions-Policy"; value = "geolocation=(self)" },
                {
                    name = "Strict-Transport-Security";
                    value = "max-age=63072000";
                },
                { name = "X-Frame-Options"; value = "DENY" },
                { name = "X-Content-Type-Options"; value = "nosniff" },
            ];
        };
        transformed;
    };

    public func  createEmbeddings(words: Text) : async Text {
        let ic : HTTPTypes.IC = actor ("aaaaa-aa");
        let url = "https://886e-197-210-84-76.ngrok-free.app/api/embed";
        let idempotency_key : Text = generateUUID();
        let request_headers = [
            { name = "Content-Type"; value = "application/json" },
            { name = "Idempotency-Key"; value = idempotency_key },
        ];

        let request_body_json : Text = "{ \"words\" : \"" # words # "\" }";
        let request_body_as_Blob : Blob = Text.encodeUtf8(request_body_json);
        let request_body_as_nat8 : [Nat8] = Blob.toArray(request_body_as_Blob); // e.g [34, 34,12, 0]

        // 2.2.1 Transform context
        let transform_context : HTTPTypes.TransformContext = {
            function = transform;
            context = Blob.fromArray([]);
        };

        // 2.3 The HTTP request
        let http_request : HTTPTypes.HttpRequestArgs = {
            url = url;
            max_response_bytes = null;
            headers = request_headers;
            body = ?request_body_as_nat8;
            method = #post;
            transform = ?transform_context;
        };

        //3. ADD CYCLES TO PAY FOR HTTP REQUEST
        Cycles.add<system>(21_850_258_000);

        //4. MAKE HTTP REQUEST AND WAIT FOR RESPONSE
        //Since the cycles were added above, you can just call the management canister with HTTPS outcalls below
        let http_response : HTTPTypes.HttpResponsePayload = await ic.http_request(http_request);

        //5. DECODE THE RESPONSE
        let response_body : Blob = Blob.fromArray(http_response.body);
        let decoded_text : Text = switch (Text.decodeUtf8(response_body)) {
            case (null) { "No value returned" };
            case (?y) { y };
        };
        //6. RETURN RESPONSE OF THE BODY
        let result : Text = decoded_text;
        result;
    };

    func generateUUID() : Text {
        "UUID-123456789";
    };

    // Cycles Functions
    public shared ({ caller = caller }) func wallet_receive() : async () {
        ignore Cycles.accept<system>(Cycles.available());
        Debug.print("intital cycles deposited by " # debug_show (caller));
    };

};
