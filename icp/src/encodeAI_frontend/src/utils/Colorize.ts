import * as colorizer from "json-colorizer";
import * as colorette from "colorette";

/**
 * @private
 */
export class Colorize {
  public static replaceLine(text: string): string {
    return "\x1b[A\x1b[2K" + text;
  }

  public static error(error: Error | string): string {
    if (typeof error === "string") {
      return `\x1b[31;1m${error}\x1b[0m`;
    } else {
      return `\x1b[31;1m${error.message}\x1b[0m`;
    }
  }

  public static output(
    output: object | string,
    quote: string = "",
    units: string = ""
  ): string {
    if (typeof output === "string") {
      return `\x1b[32m${quote}${output}${quote}\x1b[0m`;
    } else if (typeof output === "object" && output !== null) {
      return colorizer.colorize(output, {
        indent: 2,
        colors: {
          Brace: colorette.white,
          Bracket: colorette.white,
          Colon: colorette.white,
          Comma: colorette.white,
          StringKey: colorette.white,
          StringLiteral: colorette.green,
          NumberLiteral: colorette.blue,
          BooleanLiteral: colorette.blue,
          NullLiteral: colorette.blue,
          Whitespace: colorette.white,
        },
      });
    } else if (typeof output == "number") {
      return `\x1b[34m${output}${units}\x1b[0m`;
    } else {
      return `\x1b[34m${output}\x1b[0m`;
    }
  }

  public static progress(message: string): string {
    return message;
  }

  public static success(message: string): string {
    return `\x1b[32;1m${message}\x1b[0m`;
  }

  public static title(title: string): string {
    return `\x1b[35;1m${title}\x1b[0m`;
  }

  public static value(field: string, value: any, units: string = ""): string {
    return `${field}: ${Colorize.output(value, '"', units)}`;
  }

  public static warning(warning: string): string {
    return `\x1b[33m${warning}\x1b[0m`;
  }
}
