import Error "mo:base/Error";
import Map "mo:map/Map";
import { thash } "mo:map/Map";
import Text "mo:base/Text";

actor class IndexManager() = this {
    type Index = {
        count : Nat;
        name : Text;
        uriToId : Map.Map<Text, Text>;
        idToUri : Map.Map<Text, Text>;
    };

    stable var _index : ?Index = null;
    var indexExists : Bool = false;

    public func createIndex(indexName : Text) : async () {
        _index := ?{
            count = 0;
            name = indexName;
            uriToId = Map.new<Text, Text>();
            idToUri = Map.new<Text, Text>();
        };
        indexExists := true;
    };

    public func addDocument(uri : Text, documentID : Text) : async () {
        switch (_index) {
            case null { throw Error.reject("Index does not exist") };
            case (?idx) {
                let updatedCount = idx.count + 1;

                let updatedUriToID = Map.clone(idx.uriToId);
                let updatedIdToUri = Map.clone(idx.idToUri);

                ignore Map.put(updatedUriToID, thash, uri, documentID);
                ignore Map.put(updatedIdToUri, thash, documentID, uri);

                _index := ?{
                    count = updatedCount;
                    name = idx.name;
                    uriToId = updatedUriToID;
                    idToUri = updatedIdToUri;
                };
            };
        };
    };

    public query func getURIByDocumentID(id : Text) : async Text {
        switch (_index) {
            case null { throw Error.reject("Index does not exist") };
            case (?idx) {
                switch (Map.get(idx.idToUri, thash, id)) {
                    case null { return "" };
                    case (?uri) { return uri };
                };
            };
        };
    };

    public query func getDocumentIDByURI(uri : Text) : async Text {
        switch (_index) {
            case null { throw Error.reject("Index does not exist") };
            case (?idx) {
                switch (Map.get(idx.uriToId, thash, uri)) {
                    case null { return "" };
                    case (?documentID) { return documentID };
                };
            };
        };
    };

    public query func getIndexStats() : async (Text, Nat) {
        switch (_index) {
            case (null) { throw Error.reject("Index does not exist") };
            case (?idx) {
                return (idx.name, idx.count);
            };
        };
    };
};
