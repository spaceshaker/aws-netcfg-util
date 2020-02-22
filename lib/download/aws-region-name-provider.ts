import * as AWS from "aws-sdk";

export class AwsRegionNameProvider {
  constructor(
      private readonly ec2: AWS.EC2,
  ) {
  }

  static create(region: string): AwsRegionNameProvider {
    return new AwsRegionNameProvider(new AWS.EC2({
      region,
    }));
  }

  async getAwsRegionNames(): Promise<string[]> {
    return ((await this.ec2.describeRegions({}).promise()).Regions || []).map(region => region.RegionName as string);
  }
}
