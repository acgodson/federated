import DIP20Token "./DIP20";
import DIP20Votes "./DIP20Votes";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";

module {
    type DIP20Token = DIP20Token.DIP20Token;
    type Proposal = DIP20Votes.Proposal;
    type TxReceipt = DIP20Votes.TxReceipt;

    public func deployDIP20(cycleShare : Nat) : async DIP20Token.DIP20Token {
        Cycles.add<system>(cycleShare);
        let canister = await DIP20Token.DIP20Token();
        return canister;
    };

    public func getDIP20Principal(dip20Canister : DIP20Token) : Principal {
        return Principal.fromActor(dip20Canister);
    };

    public func mintToken(dip20Canister : DIP20Token, to : Principal) : async DIP20Votes.TxReceipt {
        let baseAmount = 10_000_000_000_000_000_000;
        return await dip20Canister.mint(to, baseAmount);
    };

    public func createProposal(dip20Canister : DIP20Token, from : Principal, method : Text, documentId : Text, threshold : Nat) : async Nat {
        return await dip20Canister.createProposal(method, documentId, threshold, from);
    };

    public func getProposals(dip20Canister : DIP20Token) : async [{
        id : Nat;
        method : Text;
        documentID : Text;
        proposer : Principal;
        threshold : Nat;
    }] {
        return await dip20Canister.getProposals([0,1]);
    };

    public func vote(dip20Canister : DIP20Token, from : Principal, proposalId : Nat, support : Bool) : async () {
        await dip20Canister.vote(proposalId, support, from);
    };

    public func closeProposal(dip20Canister : DIP20Token, proposalId : Nat) : async Bool {
        return await dip20Canister.closeProposal(proposalId);
    };

    public func getProposalStatus(dip20Canister : DIP20Token, proposalId : Nat) : async ?DIP20Votes.ProposalState {
        return await dip20Canister.getProposalStatus(proposalId);
    };

    public func checkBalance(dip20Canister : DIP20Token, caller : Principal) : async Nat {
        return await dip20Canister.balanceOf(caller);
    };

    public func hasBalance(dip20Canister : DIP20Token, caller : Principal) : async Bool {
        let balance = await checkBalance(dip20Canister, caller);
        return balance > 0;
    };
};
