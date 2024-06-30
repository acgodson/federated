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


const NewProposalIntent = () => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string>("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
  };

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
          <p>token cannister: <span className="text-red-500">{token}</span></p>
        </div>
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
            <Label>To</Label>
            <div className="flex w-full">
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Amount"
              />
            </div>
          </div>

          <div className="space-y-2  w-full">
            <Label htmlFor="content">Content</Label>
            <TextArea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Document content"
            />
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
