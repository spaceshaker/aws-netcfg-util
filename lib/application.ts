import * as commander from 'commander';
import * as AWS from 'aws-sdk';
import {CommandHandler} from "./command-handler";
import {DownloadCommandHandler} from "./download/download-command-handler";
import {VpcCidrCommandHandler} from "./vpc-cidr/vpc-cidr-command-handler";
import {GlobalVpcCidrCommandHandler} from "./global-vpc-cidr/global-vpc-cidr-command-handler";

export class Application {
  private commandHandler?: CommandHandler;

  async run(): Promise<void> {
    AWS.config.region = 'us-east-1';

    const program = new commander.Command();

    program.option('--json', 'output as JSON');
    program.option('--csv', 'output as CSV');
    program.option('-f, --data-file <data-file>', 'the data file that stores AWS network configuration');
    program.option('-v, --verbose', 'enable verbose logging');

    program
        .command('download')
        .description('download AWS network configuration data')
        .option('--output-file <output-file>', 'the output file to store the downloaded data')
        .action(self => {
          self.dataFile = program.dataFile;
          self.verbose = program.verbose;
          this.commandHandler = new DownloadCommandHandler(self, []);
        });

    program
        .command('vpc-cidr')
        .description('dump a CSV file containing VPC CIDR block mappings')
        .option('--output-file <output-file>', 'the output file to write data to')
        .option('--include-subnets', 'include subnets in the output')
        .option('--include-default-vpcs', 'include default VPCs in the output')
        .action(self => {
          self.csv = program.csv;
          self.json = program.json;
          self.dataFile = program.dataFile;
          this.commandHandler = new VpcCidrCommandHandler(self, []);
        });

    program
        .command('global-vpc-cidr')
        .description('dump global VPC CIDR blocks in use')
        .option('--output-file <output-file>', 'the output file to write data to')
        .option('--include-default-vpc', 'include default VPC in the output')
        .option('--duplicates-only', 'include only VPCs used more than once')
        .action(self => {
          self.csv = program.csv;
          self.json = program.json;
          self.dataFile = program.dataFile;
          this.commandHandler = new GlobalVpcCidrCommandHandler(self, []);
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
