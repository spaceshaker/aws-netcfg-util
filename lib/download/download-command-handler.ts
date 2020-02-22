import {AbstractCommandHandler} from "../abstract-command-handler";
import * as commander from "commander";
import {RegionDownloader} from "./region-downloader";
import * as fs from 'fs';
import {MultiAccountNetworkConfigDataset} from "../multi-account-network-config-dataset";
import {AwsAccountIdProvider} from "./aws-account-id-provider";
import {AwsRegionNameProvider} from "./aws-region-name-provider";
import {loadDataset, saveDataset} from "../dataset-util";

const DEFAULT_REGION = 'us-east-1';

export class DownloadCommandHandler extends AbstractCommandHandler {
  private readonly accountIdProvider = AwsAccountIdProvider.create(DEFAULT_REGION);
  private readonly regionNameProvider = AwsRegionNameProvider.create(DEFAULT_REGION);

  constructor(program: commander.Command, args: any[]) {
    super(program, args);
  }

  async execute(): Promise<void> {
    const outputFile: string = this.program.outputFile;

    if (outputFile === undefined) {
      console.error('Output file not provided');
      process.exit(1);
    }

    const awsAccountId = await this.accountIdProvider.getAwsAccountId();

    let dataset: MultiAccountNetworkConfigDataset;
    if (!fs.existsSync(outputFile)) {
      dataset = {
        accounts: {}
      };

      dataset.accounts[awsAccountId] = {
        regions: {}
      };

      await saveDataset(outputFile, dataset);
    } else {
      dataset = await loadDataset(outputFile);
    }

    // Reset all regions for this account (in preparation for replacing them below)
    dataset.accounts[awsAccountId] = {
      regions: {}
    };

    const regions = await this.regionNameProvider.getAwsRegionNames();

    const downloaderResults$: Promise<any>[] = [];
    for (const region of regions) {
      const downloader = RegionDownloader.create(region);
      const result$ = downloader.run().then(regionResult => {
        dataset.accounts[awsAccountId].regions[region] = regionResult;
      });
      downloaderResults$.push(result$);
    }

    await Promise.all(downloaderResults$);

    await saveDataset(outputFile, dataset);
  }
}
