import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";

import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Option "mo:base/Option";
import Array "mo:base/Array";

import Buckets "../Storage/Buckets";

module {

    public type Bucket = Buckets.Bucket;
    public type CanisterState<Bucket, Nat> = {
        bucket : Bucket;
        var size : Nat;
    };
    public let threshold = 2147483648; // ~2GB
    public let cycleShare = 500_000_000_000;

    public func sliceText(text : Text, start : Nat, end : Nat) : Text {
        var slicedText = "";
        var i = start;
        while (Nat.less(i, end)) {
            let char = Text.fromChar(Text.toArray(text)[i]);
            slicedText := Text.concat(slicedText, char);
            i := Nat.add(i, 1);
        };
        slicedText;
    };

    public func newEmptyBucket(canisters : [var ?CanisterState<Bucket, Nat>]) : async Bucket {
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

    public func getEmptyBucket(canisters : [var ?CanisterState<Bucket, Nat>], s : Nat) : async Bucket {
        let cs : ?(?CanisterState<Bucket, Nat>) = Array.find<?CanisterState<Bucket, Nat>>(
            Array.freeze(canisters),
            func(cs : ?CanisterState<Bucket, Nat>) : Bool {
                switch (cs) {
                    case null { false };
                    case (?cs) {
                        Debug.print("found canister with principal..." # debug_show (Principal.toText(Principal.fromActor(cs.bucket))));
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
            case null { await newEmptyBucket(canisters) };
            case (?eb) { eb };
        };
        c;
    };

    public func getBucket(canisters : [var ?CanisterState<Bucket, Nat>], cid : Principal) : async ?Bucket {
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

};
