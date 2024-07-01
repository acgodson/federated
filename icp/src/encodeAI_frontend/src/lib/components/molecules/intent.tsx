import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Hourglass, Loader } from "lucide-react";

import { Button } from "../atoms/button";
import { Separator } from "../atoms/separator";
import { cn } from "../../../utils";

import { Alert, AlertDescription } from "../atoms/alert";
import { Proposal } from "../organisms/docs-feed";

const IntentHead = ({ proposal }: { proposal: Proposal | any }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4 items-center">
        <div className="relative w-fit">
          <Hourglass />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          Proposal {(proposal as Proposal)?.id}{" "}
        </h3>
      </div>
      <div className="flex gap-2 bg-slate-200 p-1 rounded-lg text-gray-700">
        {(proposal as Proposal)?.documentTitle}
      </div>
    </div>
  );
};

const IntentBody = ({
  onSubmit,
  proposal,
}: {
  onSubmit: Function;
  proposal: Proposal | any;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleButtonClick = async () => {
    setIsSubmitting(true);
    await onSubmit(proposal.documentTitle, proposal.documentID, proposal.id);
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* <Alert variant="destructive">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert> */}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col gap-2 text-gray-700 text-base font-semibold w-full">
          <p className="text-gray-500 font-bold text-xs cursor-pointer  underline">
            🔗 view more
          </p>
        </div>
        <div className="flex w-full gap-2 items-center">
          <Separator
            className=" bg-slate-200 hidden sm:block"
            orientation="vertical"
          />
          <Button
            variant={"default"}
            className={cn("bg-zinc-800 text-white hover:bg-zinc-700 w-full")}
            // onClick={handleButtonClick}
            disabled={
              isSubmitting || (proposal as Proposal).status !== "active"
            }
          >
            {(proposal as Proposal).status !== "active"
              ? proposal.status
              : "Vote"}
          </Button>
          <Button
            variant={"default"}
            className={cn("bg-zinc-800 text-white hover:bg-zinc-700 w-full")}
            onClick={handleButtonClick}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Closing..." : "Close Proposal"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export { IntentBody, IntentHead };
