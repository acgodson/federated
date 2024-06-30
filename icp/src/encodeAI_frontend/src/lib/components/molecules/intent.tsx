import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Hourglass, Loader } from "lucide-react";

import { Button } from "../atoms/button";
import { Separator } from "../atoms/separator";
import { cn } from "../../../utils";

import { Alert, AlertDescription } from "../atoms/alert";

const IntentHead = () => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4 items-center">
        <div className="relative w-fit">
          <Hourglass />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Proposal</h3>
      </div>
      <div className="flex gap-2 bg-slate-200 p-1 rounded-lg text-gray-700">
        any order information about document
      </div>
    </div>
  );
};

const IntentBody = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleButtonClick = async () => {
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
    }, 3000);
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
            disabled={isSubmitting}
          >
            Vote
          </Button>
          <Button
            variant={"default"}
            className={cn("bg-zinc-800 text-white hover:bg-zinc-700 w-full")}
            // onClick={handleButtonClick}
            disabled={isSubmitting}
          >
            Close Proposal
          </Button>
        </div>
      </div>
    </div>
  );
};

export { IntentBody, IntentHead };
