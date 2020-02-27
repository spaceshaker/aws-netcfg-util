import {AbstractCommandHandler, OutputFormat} from "../abstract-command-handler";
import * as commander from "commander";
import {loadDataset} from "../dataset-util";
import {MultiAccountNetworkConfigDataset} from "../multi-account-network-config-dataset";
import {Account} from '../account';
import * as stream from 'stream';
import * as fs from 'fs';

export class Tag {
  constructor(
      private readonly tag: any,
  ) {
  }

  get key(): string {
    return this.tag.Key;
  }

  get value(): string {
    return this.tag.Value;
  }
}

export class SubnetAdapter {
  constructor(
      private readonly subnet: any,
  ) {
  }

  get subnetId(): string {
    return this.subnet.SubnetId;
  }

  get cidrBlock(): string {
    return this.subnet.CidrBlock;
  }

  get tags(): Tag[] {
    return (this.subnet.Tags as any[]).map(tag => new Tag(tag));
  }

  getTag(key: string): Tag | undefined {
    const filteredTags = this.tags.filter(tag => tag.key === key);
    return filteredTags.length === 1 ? filteredTags[0] : undefined;
  }
}



export class VpcAdapter {
  constructor(
      private readonly vpc: any,
      private readonly subnets$: any[],
  ) {
  }

  get vpcId(): string {
    return this.vpc.VpcId;
  }

  get cidrBlock(): string {
    return this.vpc.CidrBlock;
  }

  get tags(): Tag[] {
    return (this.vpc.Tags as any[]).map(tag => new Tag(tag));
  }

  get subnets(): SubnetAdapter[] {
    return this.subnets$.filter(subnet => subnet.VpcId === this.vpcId).map(subnet => new SubnetAdapter(subnet));
  }

  get defaultVpc(): boolean {
    return this.vpc.IsDefault;
  }

  getTag(key: string): Tag | undefined {
    const filteredTags = this.tags.filter(tag => tag.key === key);
    return filteredTags.length === 1 ? filteredTags[0] : undefined;
  }
}

export class RegionAdapter {
  constructor(
      readonly regionName: string,
      private readonly region: any,
  ) {
  }

  get vpcs(): VpcAdapter[] {
    return (this.region.vpcs as any[]).map(vpc => new VpcAdapter(vpc, this.region.subnets));
  }
}

export class AccountAdapter {
  constructor(
      readonly accountId: string,
      private readonly account: Account,
  ) {
  }

  get regions(): RegionAdapter[] {
    const regions = Object.keys(this.account.regions);
    return regions.map(region => new RegionAdapter(region, this.account.regions[region]));
  }
}

export class DatasetAdapter {
  constructor(
      private readonly dataset: MultiAccountNetworkConfigDataset,
  ) {
  }

  get accounts(): AccountAdapter[] {
    const awsAccountIds = Object.keys(this.dataset.accounts);
    return awsAccountIds.map(awsAccountId => new AccountAdapter(awsAccountId, this.dataset.accounts[awsAccountId]));
  }
}

export interface VpcCidrInput {
  inputFile: string;
  outputFile?: string;
  includeSubnets: boolean;
  includeDefaultVpcs: boolean;
}

export interface VpcCidrResult {
  accounts: {
    [key: string]: {
      regions: {
        [key: string]: {
          vpcs: {
            [key: string]: {
              vpcCidrBlock: string;
              name: string;
              subnets?: {
                [key: string]: {
                  subnetCidrBlock: string;
                  name: string;
                }
              }
            }
          }
        }
      }
    }
  }
}

export class VpcCidrCommandHandler extends AbstractCommandHandler {
  constructor(program: commander.Command, args: any[]) {
    super(program, args);
  }

  async execute(): Promise<void> {
    const dataFile: string = this.program.dataFile;

    if (dataFile === undefined) {
      console.error('Data file not provided');
      process.exit(1);
    }

    const outputFile: string | undefined = this.program.outputFile;

    let includeSubnets = false;
    if (this.program.includeSubnets) {
      includeSubnets = true;
    }

    let includeDefaultVpcs = false;
    if (this.program.includeDefaultVpcs) {
      includeDefaultVpcs = true;
    }

    const result = await this.executeInternal({
      inputFile: dataFile,
      outputFile,
      includeSubnets,
      includeDefaultVpcs,
    });

    const outputStream: stream.Writable = outputFile === undefined ? process.stdout : fs.createWriteStream(outputFile);

    if (this.outputFormat === OutputFormat.JSON) {
      outputStream.write(JSON.stringify(result));
      outputStream.write('\n');
    } else {
      const headerRecord = [
        'Account ID',
        'Region',
        'VPC CIDR',
        'VPC ID',
        'Name',
      ];
      if (includeSubnets) {
        headerRecord.push('Subnet CIDR', 'Subnet ID');
      }
      outputStream.write(headerRecord.join(','));
      outputStream.write('\n');

      for (const awsAccountId of Object.keys(result.accounts)) {
        const awsAccountRecord = result.accounts[awsAccountId];
        for (const regionName of Object.keys(awsAccountRecord.regions)) {
          const regionRecord = awsAccountRecord.regions[regionName];
          for (const vpcId of Object.keys(regionRecord.vpcs)) {
            const vpcRecord = regionRecord.vpcs[vpcId];

            const vpcRow = [
              awsAccountId,
              regionName,
              vpcRecord.vpcCidrBlock,
              vpcId,
              vpcRecord.name,
            ];
            if (includeSubnets) {
              vpcRow.push('', '');
            }
            outputStream.write(vpcRow.join(','));
            outputStream.write('\n');

            if (includeSubnets && vpcRecord.subnets !== undefined) {
              for (const subnetId of Object.keys(vpcRecord.subnets)) {
                const subnetRecord = vpcRecord.subnets[subnetId];

                const subnetRow = [
                  awsAccountId,
                  regionName,
                  vpcRecord.vpcCidrBlock,
                  vpcId,
                  subnetRecord.name,
                  subnetRecord.subnetCidrBlock,
                  subnetId
                ];

                outputStream.write(subnetRow.join(','));
                outputStream.write('\n');
              }
            }
          }
        }
      }
    }

    if (outputFile !== undefined) {
      outputStream.end();
    }
  }

  private async executeInternal(input: VpcCidrInput): Promise<VpcCidrResult> {
    const dataset = await loadDataset(input.inputFile);
    const datasetAdapter = new DatasetAdapter(dataset);

    const vpcCidrResult: VpcCidrResult = {
      accounts: {}
    };
    const  allAccounts = vpcCidrResult.accounts;

    for (const account of datasetAdapter.accounts) {
      allAccounts[account.accountId] = {
        regions: {}
      };
      const thisAccount = allAccounts[account.accountId];

      for (const region of account.regions) {
        thisAccount.regions[region.regionName] = {
          vpcs: {}
        };
        const thisRegion = thisAccount.regions[region.regionName];

        for (const vpc of region.vpcs) {
          if (vpc.defaultVpc && !input.includeDefaultVpcs) {
            continue;
          }

          thisRegion.vpcs[vpc.vpcId] = {
            vpcCidrBlock: vpc.cidrBlock,
            name: vpc.getTag('Name')?.value || '',
          };
          const thisVpc = thisRegion.vpcs[vpc.vpcId];

          if (input.includeSubnets) {
            thisVpc.subnets = {};

            for (const subnet of vpc.subnets) {
              thisVpc.subnets[subnet.subnetId] = {
                subnetCidrBlock: subnet.cidrBlock,
                name: subnet.getTag('Name')?.value || '',
              };
            }
          }
        }
      }
    }

    return vpcCidrResult;
  }
}
