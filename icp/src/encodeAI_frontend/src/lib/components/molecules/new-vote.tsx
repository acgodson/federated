import React, { useEffect, useState } from "react";

import { Button } from "../atoms/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../atoms/dialog";
import { Principal } from "@dfinity/principal";

const NewVoteIntent = ({
  title,
  isDisabled,
  docId,
  onSubmit,
}: {
  title: string;
  docId: string;
  isDisabled: boolean;
  onSubmit: (choice: boolean) => void;
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("");

  //   const handleMint = async () => {
  //     try {
  //       setIsLoading(true);
  //       const _tokenPrincipal = await encodeAI_backend.getDIP20Principal();
  //       if (_tokenPrincipal[0]) {
  //         setStatus("Minting...");
  //         const _ = await encodeAI_backend.mintToken();
  //         setToken(_tokenPrincipal[0].toText());
  //       } else {
  //         //deploy the token then mint
  //         setStatus("Deploying...");
  //         const _token = await encodeAI_backend.deployDIP20();
  //         setToken(_token.toText());
  //         //deploy the token then mint
  //         setStatus("Minting...");
  //         const _ = await encodeAI_backend.mintToken();
  //       }
  //       setStatus("");
  //       setIsLoading(false);
  //     } catch (e) {
  //       console.log(e);
  //       setStatus("");
  //       setIsLoading(false);
  //     }
  //   };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-zinc-800 text-white hover:bg-zinc-700"
          disabled={isDisabled}
        >
          {title}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-white sm:rounded-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            Add Vectors from{" "}
            <span
              className="bg-gray-200 text-gray-500 p-1"
              style={{
                fontWeight: "lighter",
              }}
            >
              {docId}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-x-2  w-full">
          <br />
          <br />
          <Button
            type="submit"
            className="w-full text-black bg-white-700"
            disabled={isSubmitting}
            onClick={() => onSubmit(false)}
          >
            Vote No
          </Button>

          <br />
          <br />

          <Button
            type="submit"
            className="w-full bg-zinc-800 text-white hover:bg-zinc-700"
            disabled={isSubmitting}
            onClick={() => onSubmit(true)}
          >
            Vote Yes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewVoteIntent;
