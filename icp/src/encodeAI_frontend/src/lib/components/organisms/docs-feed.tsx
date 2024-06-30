import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../atoms/accordion";
import { IntentBody, IntentHead } from "../molecules/intent";
import NewIntent from "../molecules/new-intent";

const IntentsFeed = () => {
  const [showNewIntent, setShowNewIntent] = useState(true);
  //we shall display all the document feeds here
  return (
    <Accordion type="single" collapsible className="w-full">
      {showNewIntent && <NewIntent />}

      <AccordionItem value={"0"} className="border-b-2">
        <AccordionTrigger>
          <IntentHead />
        </AccordionTrigger>
        <AccordionContent>
          <IntentBody />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default IntentsFeed;
