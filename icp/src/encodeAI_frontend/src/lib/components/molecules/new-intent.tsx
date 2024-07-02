import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "../atoms/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../atoms/dialog";
import { Input } from "../atoms/input";
import { Label } from "../atoms/label";
import { TextArea } from "../atoms/textArea";
import { encodeAI_backend } from "../../../../../declarations/encodeAI_backend";
import { extractTextFromFile } from "../../../utils";
import { Alert, AlertDescription } from "../atoms/alert";
import { Content } from "@radix-ui/react-dialog";
import { Principal } from "@dfinity/principal";

const NewProposalIntent = () => {
  const [file, setFile] = useState<any | File>();
  const [content, setContent] = useState<string | null>();
  const [title, setTitle] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string>("");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (title.length < 2 || (content && content.length < 4)) {
      console.log("invalid paramaters");
      return;
    }
    try {
      const result = await encodeAI_backend.addDocument(
        title,
        content as string
      );
      alert("document added")
      console.log(result);
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      if (
        (file && file.type === "application/msword") ||
        (file &&
          file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      ) {
        setFile(file);
      } else {
        setIsError(true);
        setErrorTitle("Unsupported File Format");
        setErrorMessage(
          "Currently, we only accept documents in .doc or .docx format."
        );
      }
    }
  };

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const _content = reader.result as ArrayBuffer;
        const textContent = await extractTextFromFile(_content);
        // console.log(content);
        setContent(textContent);
      };
      reader.readAsArrayBuffer(file);
    }
  }, [file, content, setContent]);

  const handleMint = async () => {
    try {
      setIsLoading(true);
      const _tokenPrincipal = await encodeAI_backend.getDIP20Principal();
      if (_tokenPrincipal[0]) {
        setStatus("Minting...");
        const _ = await encodeAI_backend.mintToken();
        setToken(_tokenPrincipal[0].toText());
      } else {
        //deploy the token then mint
        setStatus("Deploying...");
        const _token = await encodeAI_backend.deployDIP20();
        setToken(_token.toText());
        //deploy the token then mint
        setStatus("Minting...");
        const _ = await encodeAI_backend.mintToken();
      }
      setStatus("");
      setIsLoading(false);
    } catch (e) {
      console.log(e);
      setStatus("");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function fetchToken() {
      const _tokenPrincipal = await encodeAI_backend.getDIP20Principal();
      if (_tokenPrincipal[0]) {
        setToken(_tokenPrincipal[0].toText());
      }
    }
    fetchToken();
  }, []);

  return (
    <Dialog>
      <div className="flex justify-between gap-4">
        <div className="flex justify-between gap-3">
          <p>
            token cannister: <span className="text-red-500">{token}</span>
          </p>
        </div>

    
        {isError && (
          <>
            <Alert title={errorTitle}>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </>
        )}

        <div className="flex justify-between gap-3">
          <Button
            variant="default"
            className="bg-zinc-800 text-white hover:bg-zinc-700"
            onClick={handleMint}
          >
            {isLoading ? status : "Mint DIP20-Token"}
          </Button>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-zinc-800 text-white hover:bg-zinc-700"
              disabled={!token}
            >
              Add New Document
            </Button>
          </DialogTrigger>
        </div>
      </div>

      <DialogContent className="sm:max-w-[425px] bg-white sm:rounded-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create New Proposal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 flex-col w-full">
          <div className="space-y-2  w-full">
            <Label>Title</Label>
            <div className="flex w-full">
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
              />
            </div>
          </div>

          <div className="space-y-2  w-full">
            <Label htmlFor="content">Content</Label>
            {content ? (
              <TextArea
                id="content"
                value={content}
                rows={4}
                cols={4}
                readOnly={true}
                style={{
                  height: "100px",
                  overflowY: "auto",
                }}
                // onChange={(e) => setContent(e.target.value)}
                placeholder="Document content"
              />
            ) : (
              <Input
                type="file"
                onChange={handleFileChange}
                placeholder="Select docx"
              />
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-zinc-800 text-white hover:bg-zinc-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Proposal..." : "Submit new Proposal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewProposalIntent;
