import React, { useState } from "react";
import { PlaceholdersAndVanishInput } from "../atoms/query-input";

import QueryResponse from "./query-response";

interface Interaction {
  userInput: string;
  aiResponse: {
    text: string;
    attachments: any[];
  } | null;
}

const QueryIntents = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  const placeholders = ["Hello?", "I have a question?", "What do you think?"];

  const getAIResponse = async (
    input: string
  ): Promise<Interaction["aiResponse"]> => {
    try {
      //take the input and run prompts
      return {
        text: "",
        attachments: [],
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

    const aiResponse = await getAIResponse(currentInput);
    const newInteraction: Interaction = {
      userInput: currentInput,
      aiResponse: aiResponse,
    };

    setInteractions([...interactions, newInteraction]);
    setCurrentInput("");
    setIsFetching(false);
  };

  return (
    <div className="flex flex-col justify-between items-center gap-10 min-h-60">
      {interactions.length === 0 ? (
        <>
          <h2 className="text-xl text-center sm:text-3xl text-black">
            Clanopedia!...
          </h2>
          <img
            alt="query-db"
            src="https://illustrations.popsy.co/pink/business-success-chart.svg"
            width={400}
            height={400}
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
              {interaction.aiResponse ? (
                <QueryResponse
                  text={interaction.aiResponse.text}
                  attachments={interaction.aiResponse.attachments}
                />
              ) : (
                <p>Loading response...</p>
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
