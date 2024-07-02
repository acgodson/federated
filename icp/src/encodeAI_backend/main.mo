// # main.mo
import Error "mo:base/Error";
import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";

import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Iter "mo:base/Iter";

import DAO "./DAO/DAO";
import Storage "./Storage/Storage";

import Buckets "./Storage/Buckets";
import DIP20Token "./DAO/DIP20";
import DIP20Votes "./DAO/DIP20Votes";
import Types "./Utils/Types";
import HTTPTypes "./Utils/HTTPTypes";

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

    private func _createProposal(method : Text, documentId : Text, threshold : Nat, caller : Principal) : async Nat {
        switch (dip20Canister) {
            case (?canister) {
                return await DAO.createProposal(canister, caller, method, documentId, threshold);
            };
            case null { throw Error.reject("DIP20 token not deployed.") };
        };
    };

    public shared (_) func getProposals() : async [{
        id : Nat;
        method : Text;
        documentID : Text;
        proposer : Principal;
        threshold : Nat;
    }] {
        switch (dip20Canister) {
            case (?canister) {
                return await DAO.getProposals(canister);
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

    public shared (msg) func addDocument(title : Text, content : Text) : async ?(Principal, Text, Nat) {
        let result = await Storage.addDocument(canisters, title, content);
        var response : ?(Principal, Text, Nat) = null;

        // Creating a proposal
        switch (result) {
            case (?principal, ?docID) {
                // Use a method and threshold for the proposal
                let method = "addVector";
                let threshold = 1; // test threshold value

                // Create the proposal
                let proposalId = await _createProposal(method, docID, threshold, msg.caller);
                response := ?(principal, docID, proposalId);
            };
            case (_) {
                // Handle error case if document addition failed
                throw Error.reject("Failed to add document.");
            };
        };
        return response;
    };

    public func addVector(cid : Principal, docID : Text, vectorId : Text, start : Nat, end : Nat, vector : [Float]) : async ?Text {
        // Fetch all proposals
        let proposals = await getProposals();
        Debug.print("Existing proposals: " # debug_show (proposals));
        Debug.print("Document ID being checked: " # docID);

        var matchedProposal : ?{
            id : Nat;
            method : Text;
            documentID : Text;
            proposer : Principal;
            threshold : Nat;
        } = null;

        // Find the proposal matching the document ID
        label l {
            for (proposal in proposals.vals()) {
                Debug.print("Checking proposal: " # debug_show (proposal));
                if (proposal.documentID == docID) {
                    matchedProposal := ?proposal;
                    Debug.print("Matched proposal found: " # debug_show (proposal));
                    break l();
                };
            };
        };

        // Check if a matched proposal is found and its state is approved
        switch (matchedProposal) {
            case (null) {
                // No proposal found for the given document ID
                throw Error.reject("No proposal found for the given document ID.");
            };
            case (?proposal) {
                // Check if the proposal state is approved
                let proposalStatus = await getProposalStatus(proposal.id);
                switch (proposalStatus.status) {
                    case (? #approved) {
                        // Proceed to add the vector if the proposal is approved
                        return await Storage.addVector(canisters, cid, docID, vectorId, start, end, vector);
                    };
                    case (_) {
                        // Proposal state is not approved
                        throw Error.reject("Proposal for the document is not approved yet.");
                    };
                };
            };
        };
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

    public func createEmbeddings(words : [Text]) : async Text {
        let ic : HTTPTypes.IC = actor ("aaaaa-aa");
        let url = "https://886e-197-210-84-76.ngrok-free.app/api/embed";
        let idempotency_key : Text = generateUUID();
        let request_headers = [
            { name = "Content-Type"; value = "application/json" },
            { name = "Idempotency-Key"; value = idempotency_key },
        ];

        // Construct the JSON string representation of the array
        var words_json = "[" # "\"" # words[0] # "\"";
        for (word in Iter.range(1, Array.size(words) - 1)) {
            words_json #= ",\"" # words[word] # "\"";
        };
        words_json #= "]";

        let request_body_json : Text = "{\"words\":" # words_json # "}";
        Debug.print("Request Body JSON: " # request_body_json);


        let request_body_as_Blob : Blob = Text.encodeUtf8(request_body_json);
        let request_body_as_nat8 : [Nat8] = Blob.toArray(request_body_as_Blob);

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

    public func fetchQueryResponse(prompt : Text, context : Text) : async Text {
        let ic : HTTPTypes.IC = actor ("aaaaa-aa");
        let url = "https://886e-197-210-84-76.ngrok-free.app/api/query";
        let idempotency_key : Text = generateUUID();
        let request_headers = [
            { name = "Content-Type"; value = "application/json" },
            { name = "Idempotency-Key"; value = idempotency_key },
        ];


        // Construct request body based on context presence
        let request_body_json : Text = if (context == "") {
            "{ \"prompt\" : \"" # prompt # "\" }";
        } else {
            "{ \"prompt\" : \"" # prompt # "\", \"context\" : \"" # context # "\" }";
        };

        Debug.print("query request body: " # request_body_json);

        let request_body_as_Blob : Blob = Text.encodeUtf8(request_body_json);
        let request_body_as_nat8 : [Nat8] = Blob.toArray(request_body_as_Blob);

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
