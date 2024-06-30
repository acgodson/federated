import React, { useState } from "react";
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

const NewProposalIntent = () => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="bg-zinc-800 text-white hover:bg-zinc-700"
          >
            Add New Document
          </Button>
        </div>
      </DialogTrigger>
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
