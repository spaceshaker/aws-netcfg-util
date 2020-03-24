import {AbstractCommandHandler, OutputFormat} from "../abstract-command-handler";
import * as commander from "commander";
import * as stream from "stream";
import * as fs from "fs";
import {loadDataset} from "../dataset-util";
import {DatasetAdapter} from "../vpc-cidr/vpc-cidr-command-handler";

export interface GlobalVpcCidrInput {
  inputFile: string;
  outputFile?: string;
  includeDefaultVpc: boolean;
  duplicatesOnly: boolean;
}

export interface GlobalVpcCidrResult {
  vpcCidrBlocks: string[];
}

export class GlobalVpcCidrCommandHandler extends AbstractCommandHandler {
  constructor(program: commander.Command, args: any[]) {
    super(program, args);
  }

  async execute(): Promise<void> {
    const dataFile: string = this.program.dataFile;

    if (dataFile === undefined) {
      console.error('Data file not provided');
      process.exit(1);
    }

    let includeDefaultVpc = false;
    if (this.program.includeDefaultVpc) {
      includeDefaultVpc = true;
    }

    let duplicatesOnly = false;
    if (this.program.duplicatesOnly) {
      duplicatesOnly = true;
    }

    const outputFile: string | undefined = this.program.outputFile;

    const result = await this.executeInternal({
      inputFile: dataFile,
      outputFile,
      includeDefaultVpc,
      duplicatesOnly
    });

    const outputStream: stream.Writable = outputFile === undefined ? process.stdout : fs.createWriteStream(outputFile);

    if (this.outputFormat === OutputFormat.JSON) {
      outputStream.write(JSON.stringify(result));
      outputStream.write('\n');
    } else {
      const headerRecord = [
        'VPC CIDR'
      ];
      outputStream.write(headerRecord.join(','));
      outputStream.write('\n');

      for (const vpcCidrBlock of result.vpcCidrBlocks) {
        outputStream.write(vpcCidrBlock);
        outputStream.write('\n');
      }
    }

    if (outputFile !== undefined) {
      outputStream.end();
    }
  }

  private async executeInternal(input: GlobalVpcCidrInput): Promise<GlobalVpcCidrResult> {
    const dataset = await loadDataset(input.inputFile);
    const datasetAdapter = new DatasetAdapter(dataset);

    const vpcCidrBlockSet = new Set<string>();
    const vpcCidrBlockDuplicatesSet = new Set<string>();

    for (const account of datasetAdapter.accounts) {
      for (const region of account.regions) {
        for (const vpc of region.vpcs) {
          // Skip default VPC if requested
          if (vpc.defaultVpc && !input.includeDefaultVpc) {
            continue;
          }

          const cidrBlock = vpc.cidrBlock;

          if (vpcCidrBlockSet.has(cidrBlock)) {
            vpcCidrBlockDuplicatesSet.add(cidrBlock);
          }

          vpcCidrBlockSet.add(cidrBlock);
        }
      }
    }

    return {
      vpcCidrBlocks: Array.from(input.duplicatesOnly ? vpcCidrBlockDuplicatesSet : vpcCidrBlockSet).sort(),
    };
  }
}
