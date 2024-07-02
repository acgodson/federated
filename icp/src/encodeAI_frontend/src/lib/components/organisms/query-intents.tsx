import React, { useState } from "react";
import { Loader } from "lucide-react";
import { PlaceholdersAndVanishInput } from "../atoms/query-input";
import imgUrl from "/logo2.svg";
import art from "/art.svg";

import QueryResponse from "./query-response";
import { encodeAI_backend } from "../../../../../declarations/encodeAI_backend";
import { LocalDocumentIndex } from "../../db/LocalDocumentIndex";
import { Principal } from "@dfinity/principal";

interface Interaction {
  userInput: string;
  aiResponse: {
    text: string;
    references: any[];
  } | null;
}

const QueryIntents = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  const placeholders = ["Hello?", "I have a question?", "What do you think?"];

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

  const similarityCheck = async (promptEmbedding: any) => {
    // Initialize an array to store the results
    const queryResults: any = [];
    let chunkSize = 1500;
    const _principal = await encodeAI_backend.getPrincipal();
    if (_principal[0]) {
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

      const results = await indexInstance.queryDocuments(promptEmbedding, {
        maxDocuments: 4,
        maxChunks: 512,
      });

      for (const result of results) {
        const resultObj: any = {
          tile: result.title,
          score: result.score,
          chunks: result.chunks.length,
          sections: [],
        };

        // Render sections if format is "sections"
        const tokens = 500;
        const sectionCount = 1;
        const overlap = true;
        const sections = await result.renderSections(
          tokens,
          sectionCount,
          overlap
        );
        resultObj.sections = sections.map((section, index) => ({
          title: sectionCount === 1 ? "Section" : `Section ${index + 1}`,
          score: section.score,
          tokens: section.tokenCount,
          text: section.text,
        }));

        queryResults.push(resultObj);
      }

      return queryResults;
    }
    return queryResults;
  };

  const getAIResponse = async (
    input: string
  ): Promise<Interaction["aiResponse"] | null> => {
    try {
      //take the input and send prompt to frontend cannister
      let response;

      const x = await encodeAI_backend.fetchQueryResponse(input, "");
      response = JSON.parse(x);

      if (!response.embedding) {
        return {
          text: response.text,
          references: response.references,
        };
      } else {
        //do similarity check and resend request
        const fetchContext = await similarityCheck(response.embedding[0]);
        console.log(fetchContext);
        if (fetchContext && fetchContext.length > 0) {
          // Map through fetchContext and resolve promises
          const contextArray = await Promise.all(
            fetchContext.map(async (x: any) => {
              const id = await getDocumentID(x.tile);
              return {
                tile: x.tile,
                id: id,
                ...x,
                sections: x.sections.map((y: any) => ({
                  text: y.text.replace(/\n+/g, "\n").replace(/\n/g, "\\n").replace(/"/g, '\\"'),
                  tokens: y.tokens,
                })),
              };
            })
          );
          // Now you can use contextArray as needed
          console.log("fine-tuned context",     contextArray[0].sections[0].text);

          const x = await encodeAI_backend.fetchQueryResponse(
            input,
            contextArray[0].sections[0].text
          );
          const newResponse = JSON.parse(x);
          console.log("new response", newResponse);
          return {
            text: newResponse.text,
            references: newResponse.references,
          };
        }
      }
      return {
        text: "",
        references: [],
      };
    } catch (e) {
      console.log(e);
      return null;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentInput(e.target.value);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentInput.trim() === "" || isFetching) return;

    setIsFetching(true);

    const placeHolderInteraction: Interaction = {
      userInput: currentInput,
      aiResponse: null,
    };

    // Add the placeholder interaction
    setInteractions((prevInteractions) => [
      ...prevInteractions,
      placeHolderInteraction,
    ]);

    const aiResponse = await getAIResponse(currentInput);

    // Replace the last ai response that is null
    setInteractions((prevInteractions) =>
      prevInteractions.map((interaction, index) =>
        index === prevInteractions.length - 1
          ? { ...interaction, aiResponse: aiResponse }
          : interaction
      )
    );

    setCurrentInput("");
    setIsFetching(false);
  };

  return (
    <div className="flex flex-col justify-between items-center gap-10 min-h-60">
      {interactions.length === 0 ? (
        <>
          <img
            alt="logo-icp"
            src={imgUrl}
            style={{
              height: "80px",
              width: "auto",
            }}
          />
          <img
            className="mt-[-10]"
            alt="query-db"
            src={art} 
            width={300}
            height={300}
          />
        </>
      ) : (
        <div className="w-full space-y-6">
          {interactions.map((interaction, index) => (
            <div key={index} className="border-b pb-4">
              <div className="flex justify-end">
                <p className="mb-2 py-2 px-4 text-right text-white dark:bg-zinc-800">
                  User: {interaction.userInput}
                </p>
              </div>
              {interaction.aiResponse && (
                <QueryResponse
                  text={interaction.aiResponse.text}
                  attachments={interaction.aiResponse.references}
                />
              )}

              {isFetching && !interaction.aiResponse && (
                <Loader className="animate-spin" />
              )}
            </div>
          ))}
        </div>
      )}

      <PlaceholdersAndVanishInput
        placeholders={placeholders}
        onChange={handleChange}
        onSubmit={onSubmit}
        value={currentInput}
        disabled={isFetching}
      />
    </div>
  );
};

export default QueryIntents;
