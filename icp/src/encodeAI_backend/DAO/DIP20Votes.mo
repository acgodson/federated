import Map "mo:map/Map";
import { nhash } "mo:map/Map";
import Error "mo:base/Error";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Result "mo:base/Result";

module DIP20Votes {

    public type ProposalState = {
        #active;
        #approved;
        #cancelled;
    };

    public type Proposal = {
        id : Nat;
        proposer : Principal;
        method : Text;
        documentID : Text;
        var state : ProposalState;
        var votesFor : Nat;
        var votesAgainst : Nat;
        threshold : Nat;
    };

    public type TxReceipt = Result.Result<Nat, { #InsufficientBalance; #InsufficientAllowance; #Unauthorized }>;

    public func createProposal(proposals : Map.Map<Nat, Proposal>, proposalCounter : Nat, proposal : Proposal) : async Nat {

        let _proposal : Proposal = {
            id = proposalCounter;
            proposer = proposal.proposer;
            method = proposal.method;
            documentID = proposal.documentID;
            var state = #active;
            var votesFor = 0;
            var votesAgainst = 0;
            threshold = proposal.threshold;
        };
        ignore Map.put(proposals, nhash, proposalCounter, _proposal);
        return proposalCounter;
    };

    public func vote(proposals : Map.Map<Nat, Proposal>, proposalId : Nat, support : Bool, _balance : Nat) : async () {
        let proposal = Map.get(proposals, nhash, proposalId);
        switch (proposal) {
            case (null) {
                throw Error.reject(" proposal not found.");
            };
            case (?prop) {
                if (prop.state != #active) {
                    throw Error.reject(" proposal not active");
                };

                if (support) {
                    prop.votesFor += _balance;

                } else {
                    prop.votesAgainst += _balance;
                };
                //adjust state
                if (prop.votesFor >= prop.threshold) {
                    prop.state := #approved;
                };
                ignore Map.put(proposals, nhash, proposalId, prop);

            };
        };
    };

    public func closeProposal(proposals : Map.Map<Nat, Proposal>, proposalId : Nat) : async Bool {
        let proposal = Map.get(proposals, nhash, proposalId);
        switch (proposal) {
            case (null) { throw Error.reject(" proposal not found.") };
            case (?prop) {
                var _approved : Bool = false;
                if (prop.state == #approved) {
                    _approved := true;
                };
                Map.delete(proposals, nhash, proposalId);
                return _approved;
            };
        };
    };

    public func getVotingPower(balance : Nat, totalSupply : Nat) : async Nat {
        return Nat.div(Nat.mul(balance, 100), totalSupply);
    };

};
