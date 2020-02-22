import {CommandHandler} from "./command-handler";
import * as commander from "commander";

export enum OutputFormat {
  JSON,
  CSV
}

export abstract class AbstractCommandHandler implements CommandHandler {
  protected constructor(
      protected readonly program: commander.Command,
      protected readonly args: any[],
  ) {
  }

  abstract execute(): Promise<void>;

  protected get outputFormat(): OutputFormat {
    if (this.program.csv) {
      return OutputFormat.CSV;
    } else {
      return OutputFormat.JSON;
    }
  }
}
