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
    const dataFile: string = this.program.dataFile;

    if (dataFile === undefined) {
      console.error('Data file not provided');
      process.exit(1);
    }

    let verbose = false;
    if (this.program.verbose) {
      verbose = true;
    }

    const awsAccountId = await this.accountIdProvider.getAwsAccountId();
    if (verbose) {
      console.log(`Running download for account ${awsAccountId}`);
    }

    let dataset: MultiAccountNetworkConfigDataset;
    if (!fs.existsSync(dataFile)) {
      dataset = {
        accounts: {}
      };

      dataset.accounts[awsAccountId] = {
        regions: {}
      };

      await saveDataset(dataFile, dataset);
    } else {
      dataset = await loadDataset(dataFile);
    }

    // Reset all regions for this account (in preparation for replacing them below)
    dataset.accounts[awsAccountId] = {
      regions: {}
    };

    const regions = await this.regionNameProvider.getAwsRegionNames();

    const downloaderResults$: Promise<any>[] = [];
    for (const region of regions) {
      const downloader = RegionDownloader.create(region, {
        verbose,
      });
      const result$ = downloader.run().then(regionResult => {
        dataset.accounts[awsAccountId].regions[region] = regionResult;
      });
      downloaderResults$.push(result$);
    }

    await Promise.all(downloaderResults$);

    await saveDataset(dataFile, dataset);
  }
}
