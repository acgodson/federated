import { Tokenizer } from "../../utils/types";
import { encode, decode } from "gpt-tokenizer";

export class GPT3Tokenizer implements Tokenizer {
  public decode(tokens: number[]): string {
    return decode(tokens);
  }

  public encode(text: string): number[] {
    return encode(text);
  }
}
