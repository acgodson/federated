import { useState } from "react";
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

const IntentsFeed = () => {
  const [showNewIntent, setShowNewIntent] = useState(true);

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
      const info = await encodeAI_backend.titleToDocumentID(docId);
      if (info[0]) {
        responseCID = info[0];
      }
    } catch (e) {
      console.log(e);
    }
    return responseCID;
  };

  const closeProposal = async (docTitle: string, docId: string) => {
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
          docId
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

  //we shall display all the document feeds here
  return (
    <Accordion type="single" collapsible className="w-full">
      {showNewIntent && <NewIntent />}

      <AccordionItem value={"0"} className="border-b-2">
        <AccordionTrigger>
          <IntentHead />
        </AccordionTrigger>
        <AccordionContent>
          <IntentBody onSubmit={closeProposal} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default IntentsFeed;
