import * as AWS from "aws-sdk";

export class AwsAccountIdProvider {
  constructor(
      private readonly sts: AWS.STS,
  ) {
  }

  static create(region: string): AwsAccountIdProvider {
    return new AwsAccountIdProvider(new AWS.STS({
      region,
    }));
  }

  async getAwsAccountId(): Promise<string> {
    return (await this.sts.getCallerIdentity({}).promise()).Account as string;
  }
}
