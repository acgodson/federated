import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../atoms/accordion";
import { IntentBody, IntentHead } from "../molecules/intent";
import NewIntent from "../molecules/new-intent";
import { encodeAI_backend } from "../../../../../declarations/encodeAI_backend";
import { Principal } from "@dfinity/principal";
import { LocalDocumentIndex } from "../../db/LocalDocumentIndex";
import { Colorize } from "../../../utils/Colorize";
import { Loader } from "lucide-react";

export interface Proposal {
  id: number;
  documentID: string;
  documentTitle: string;
  method: string;
  proposer: string;
  status: string;
}
const IntentsFeed = () => {
  const [showNewIntent, setShowNewIntent] = useState(true);
  const [proposals, setProposals] = useState<Proposal[] | any[] | null>(null);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const [fetching, setFetching] = useState(true);

  const fetchStoragePrincipal = async () => {
    const _principal = await encodeAI_backend.getPrincipal();
    try {
      if (_principal[0]) {
        setPrincipal(_principal[0]);
      }
    } catch (e) {
      console.log("error fetching principal", e);
    }
  };

  const fetchProposals = async () => {
    const _principal = principal ?? (await encodeAI_backend.getPrincipal())[0];
    try {
      if (!_principal) {
        console.log("no storage cannister found");
        return;
      }
      const _tokenPrincipal = await encodeAI_backend.getDIP20Principal();

      if (_tokenPrincipal[0]) {
        setToken(_tokenPrincipal[0].toText());
      }

      const _proposals = await encodeAI_backend.getProposals();
      if (_proposals) {
        // Reformat proposals before updating the state
        const formattedProposals = await Promise.all(
          _proposals.map(async (proposal) => {
            const documentTitle = (
              await encodeAI_backend.documentIDToTitle(proposal.documentID)
            )[0];

            const statusObj = await encodeAI_backend.getProposalStatus(
              proposal.id
            );

            // Extract status key where value is not null
            let status = Object.keys(statusObj.status[0] as unknown as any);

            return {
              id: Number(proposal.id),
              documentID: proposal.documentID,
              documentTitle,
              method: proposal.method,
              proposer: proposal.proposer.toText(),
              status: status[0] || "unknown",
            };
          })
        );

        setProposals(formattedProposals);
      }

      setFetching(false);
    } catch (e) {
      console.log("error fetching proposal", e);
      setFetching(false);
    }
  };

  const loadIsCatalog = async (principal: any) => {
    if (!principal) {
      return;
    }
    const info = await encodeAI_backend.getIndexInfo(principal);

    if (info.length > 0) {
      return true;
    } else {
      false;
    }
  };

  const getDocumentID = async (title: string) => {
    let responseCID;
    try {
      const info = await encodeAI_backend.titleToDocumentID(title);
      responseCID = info[0];
    } catch (e) {
      console.log(e);
    }
    return responseCID;
  };

  const getDocumentTitle = async (docId: string) => {
    let responseCID = "";
    try {
      const info = await encodeAI_backend.documentIDToTitle(docId);
      if (info[0]) {
        responseCID = info[0];
      }
    } catch (e) {
      console.log(e);
    }
    return responseCID;
  };

  const closeProposal = async (
    docTitle: string,
    docId: string,
    proposalId: number | bigint
  ) => {
    let chunkSize = 502;
    const _principal = await encodeAI_backend.getPrincipal();
    if (_principal[0]) {
      // setPrincipal(_principal[0]);
      const principal = Principal.fromText(_principal[0]);

      const isCatalog = await loadIsCatalog(principal);
      const indexInstance = new LocalDocumentIndex({
        indexName: _principal[0],
        isCatalog: isCatalog,
        _getDocumentId: getDocumentID,
        _getDoumentUri: getDocumentTitle,
        chunkingConfig: {
          chunkSize: chunkSize,
        },
      });
      let id: string | undefined;
      let documentResult;
      try {
        documentResult = await indexInstance.closePropsal(
          _principal[0],
          docTitle,
          docId,
          BigInt(proposalId)
        );

        id = documentResult.id;
      } catch (err) {
        console.log(
          Colorize.replaceLine(
            Colorize.error(
              `Error indexing: "${docTitle}"\n${(err as Error).message}`
            )
          )
        );
      }
      return { docTitle, id };
    }
  };

  const submitVote = async (proposalId: bigint, choice: boolean) => {
    const voteResult = await encodeAI_backend.vote(BigInt(proposalId), choice);
    console.log(voteResult);
    alert("voting succeded: ");
  };

  useEffect(() => {
    fetchStoragePrincipal();
  }, []);

  useEffect(() => {
    if (principal && fetching && !proposals) {
      fetchProposals();
    }
    console.log("proposals: ", fetching ? "fetching" : proposals);
  }, [principal, proposals, fetching]);

  //we shall display all the document feeds here
  return (
    <Accordion type="single" collapsible className="w-full">
      {showNewIntent && <NewIntent />}

      {proposals &&
        (proposals as Proposal[] | any[]).length > 0 &&
        proposals.map((proposal, i) => (
          <AccordionItem value={"0"} className="border-b-2" key={i}>
            <AccordionTrigger>
              <IntentHead proposal={proposal} />
            </AccordionTrigger>
            <AccordionContent>
              {proposals && (
                <IntentBody
                  onSubmit={closeProposal}
                  proposal={proposal}
                  onVote={submitVote}
                />
              )}
            </AccordionContent>
          </AccordionItem>
        ))}

      {fetching && <Loader className="animate-spin" />}
    </Accordion>
  );
};

export default IntentsFeed;
