import Principal "mo:base/Principal";
import Error "mo:base/Error";

import Nat "mo:base/Nat";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Map "mo:map/Map";
import { nhash } "mo:map/Map";
import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";

import DIP20Votes "./DIP20Votes";
import Types "../Utils/Types";

shared ({ caller = owner }) actor class DIP20Token() {

    let limit = 20_000_000_000_000;
    private stable var fee : Nat = 0; //free
    type Operation = Types.Operation;
    type TransactionStatus = Types.TransactionStatus;
    type TxRecord = Types.TxRecord;
    type Metadata = {
        logo : Text;
        name : Text;
        symbol : Text;
        decimals : Nat8;
        totalSupply : Nat;
        owner : Principal;
        fee : Nat;
    };

    type ProposalState = {
        #active;
        #approved;
        #cancelled;
    };

    public type Proposal = {
        id : Nat;
        proposer : Principal;
        method : Text;
        args : [Blob];
        var state : ProposalState;
        var votesFor : Nat;
        var votesAgainst : Nat;
        threshold : Nat;
    };

    // returns tx index or error msg
    type TxReceipt = Result.Result<Nat, { #InsufficientBalance; #InsufficientAllowance; #Unauthorized }>;
    private stable var owner_ : Principal = owner;
    private stable var logo_ : Text = "undefined";
    private stable var _totalSupply : Nat = 0;
    private stable var decimals_ : Nat8 = 18;
    private stable var blackhole : Principal = Principal.fromText("aaaaa-aa");
    private var balances = HashMap.HashMap<Principal, Nat>(1, Principal.equal, Principal.hash);
    private stable var feeTo : Principal = owner_;

    // voting state
    private stable var proposals : Map.Map<Nat, Proposal> = Map.new<Nat, Proposal>();
    private stable var proposalCounter : Nat = 0;
    private stable var activeProposal = false;

    // private var allowances = HashMap.HashMap<Principal, HashMap.HashMap<Principal, Nat>>(1, Principal.equal, Principal.hash);
    private stable let genesis : TxRecord = {
        caller = ?owner_;
        op = #mint;
        index = 0;
        from = blackhole;
        to = owner_;
        amount = _totalSupply;
        fee = 0;
        timestamp = Time.now();
        status = #succeeded;
    };
    private stable var ops : [TxRecord] = [genesis];

    public query func logo() : async Text {
        return "undefined";
    };

    public func name() : async Text {
        return "DAOToken";
    };

    public func symbol() : async Text {
        return "DTK";
    };

    public query func decimals() : async Nat8 {
        return decimals_;
    };

    public query func totalSupply() : async Nat {
        return _totalSupply;
    };

    public func balanceOf(owner : Principal) : async Nat {
        return _balanceOf(owner);
    };

    public query func getMetadata() : async Metadata {
        return {
            logo = logo_;
            name = "DAOToken";
            symbol = "DTK";
            decimals = decimals_;
            totalSupply = _totalSupply;
            owner = owner_;
            fee = fee;
        };
    };

    public func createProposal(method : Text, args : [Blob], threshold : Nat, proposer : Principal) : async Nat {
        if (activeProposal == true) {
            throw Error.reject("Another proposal is currently active.");
        };
        proposalCounter += 1;
        let proposal : Proposal = {
            id = proposalCounter;
            proposer;
            method = method;
            args = args;
            var state = #active;
            var votesFor = 0;
            var votesAgainst = 0;
            threshold = threshold;
        };
        activeProposal := true;
        return await DIP20Votes.createProposal(proposals, proposalCounter, proposal);
    };

    public shared (_) func vote(proposalId : Nat, support : Bool, voter : Principal) : async () {
        let balance = await balanceOf(voter);
        if (balance == 0) {
            throw Error.reject("Insufficient voting power");
        };
        await DIP20Votes.vote(proposals, proposalId, support, balance);
    };

    public shared (_) func closeProposal(proposalId : Nat) : async Bool {
        activeProposal := false;
        return await DIP20Votes.closeProposal(proposals, proposalId);
    };

    public func getVotingPower(account : Principal) : async Nat {
        let balance = _balanceOf(account);
        let _totalSupply = await totalSupply();
        return Nat.div(Nat.mul(balance, 100), _totalSupply);
    };

    public func getProposalStatus(proposalId : Nat) : async ?DIP20Votes.ProposalState {
        let proposal = Map.get(proposals, nhash, proposalId);
        switch (proposal) {
            case (null) { return null };
            case (?prop) { return ?prop.state };
        };

    };

    /// Transfers value amount of tokens to Principal to.
    public shared (msg) func transfer(to : Principal, value : Nat) : async TxReceipt {
        if (_balanceOf(msg.caller) < value + fee) {
            return #err(#InsufficientBalance);
        };
        _chargeFee(msg.caller, fee);
        _transfer(msg.caller, to, value);
        let txid = addRecord(null, #transfer, msg.caller, to, value, fee, Time.now(), #succeeded);
        return #ok(txid);
    };

    public shared (msg) func mint(to : Principal, amount : Nat) : async TxReceipt {

        Debug.print("The caller is " # debug_show (owner));

        // if (msg.caller != owner_) {
        // return #err(#Unauthorized);
        // };

        let to_balance = _balanceOf(to);
        _totalSupply += amount;
        balances.put(to, to_balance + amount);
        let txid = addRecord(?msg.caller, #mint, blackhole, to, amount, 0, Time.now(), #succeeded);
        return #ok(txid);
    };

    public shared (msg) func setFeeTo(to : Principal) {
        assert (msg.caller == owner_);
        feeTo := to;
    };

    private func _balanceOf(who : Principal) : Nat {
        switch (balances.get(who)) {
            case (?balance) { return balance };
            case (_) { return 0 };
        };
    };

    private func _chargeFee(from : Principal, fee : Nat) {
        if (fee > 0) {
            _transfer(from, feeTo, fee);
        };
    };

    private func _transfer(from : Principal, to : Principal, value : Nat) {
        let from_balance = _balanceOf(from);
        let from_balance_new : Nat = from_balance - value;
        if (from_balance_new != 0) { balances.put(from, from_balance_new) } else {
            balances.delete(from);
        };

        let to_balance = _balanceOf(to);
        let to_balance_new : Nat = to_balance + value;
        if (to_balance_new != 0) { balances.put(to, to_balance_new) };
    };

    private func addRecord(
        caller : ?Principal,
        op : Operation,
        from : Principal,
        to : Principal,
        amount : Nat,
        fee : Nat,
        timestamp : Time.Time,
        status : TransactionStatus,
    ) : Nat {
        let index = ops.size();
        let o : TxRecord = {
            caller = caller;
            op = op;
            index = index;
            from = from;
            to = to;
            amount = amount;
            fee = fee;
            timestamp = timestamp;
            status = status;
        };
        ops := Array.append(ops, [o]);
        return index;
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
