import * as commander from 'commander';
import * as AWS from 'aws-sdk';
import {CommandHandler} from "./command-handler";
import {DownloadCommandHandler} from "./download/download-command-handler";
import {VpcCidrCommandHandler} from "./vpc-cidr/vpc-cidr-command-handler";

export class Application {
  private commandHandler?: CommandHandler;

  async run(): Promise<void> {
    AWS.config.region = 'us-east-1';

    const program = new commander.Command();

    program.option('--json', 'output as JSON');
    program.option('--csv', 'output as CSV');

    program
        .command('download')
        .description('download AWS network configuration data')
        .option('--output-file <output-file>', 'the output file to store the downloaded data')
        .action(self => {
          this.commandHandler = new DownloadCommandHandler(self, []);
        });

    program
        .command('vpc-cidr')
        .description('dump a CSV file containing VPC CIDR block mappings')
        .option('--input-file <input-file>', 'the input file to pull data from')
        .option('--output-file <output-file>', 'the output file to write data to')
        .option('--include-subnets', 'include subnets in the output')
        .action(self => {
          self.csv = program.csv;
          self.json = program.json;
          this.commandHandler = new VpcCidrCommandHandler(self, []);
        });

    program.parse(process.argv);

    if (this.commandHandler !== undefined) {
      await this.commandHandler.execute();
    } else {
      program.outputHelp();
      process.exit(1);
    }
  }
}
