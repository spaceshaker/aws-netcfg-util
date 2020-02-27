import * as AWS from 'aws-sdk';

export interface RegionDownloaderOptions {
  verbose?: boolean;
}

export class RegionDownloader {
  private readonly verbose: boolean;

  constructor(
      private readonly region: string,
      private readonly ec2: AWS.EC2,
      private readonly options?: RegionDownloaderOptions,
  ) {
    this.verbose = options?.verbose || false;
  }

  static create(region: string, options?: RegionDownloaderOptions): RegionDownloader {
    const ec2 = new AWS.EC2({
      region,
    });
    return new RegionDownloader(region, ec2, options);
  }

  async run(): Promise<any> {
    if (this.verbose) {
      console.log(`[${this.region}] Beginning network configuration download`);
    }

    const vpcs$ = this.getVpcs();
    const subnets$ = this.getSubnets();
    const routeTables$ = this.getRouteTables();
    const natGateways$ = this.getNatGateways();
    const transitGateways$ = this.getTransitGateways();
    const internetGateways$ = this.getInternetGateways();
    const vpcEndpoints$ = this.getVpcEndpoints();
    const vpcPeeringConnections$ = this.getVpcPeeringConnections();
    const vpnConnections$ = this.getVpnConnections();
    const vpnGateways$ = this.getVpnGateways();
    const networkInterfaces$ = this.getNetworkInterfaces();
    const securityGroups$ = this.getSecurityGroups();
    const networkAcls$ = this.getNetworkAcls();

    if (this.verbose) {
      console.log(`[${this.region}] Waiting for tasks to complete`);
    }

    await Promise.all([
        vpcs$,
        subnets$,
        routeTables$,
        natGateways$,
        transitGateways$,
        internetGateways$,
        vpcEndpoints$,
        vpcPeeringConnections$,
        vpnConnections$,
        vpnGateways$,
        networkInterfaces$,
        securityGroups$,
        networkAcls$,
    ]);

    if (this.verbose) {
      console.log(`[${this.region}] Download complete`);
    }

    return {
      vpcs: await vpcs$,
      subnets: await subnets$,
      routeTables: await routeTables$,
      natGateways: await natGateways$,
      transitGateways: await transitGateways$,
      internetGateways: await internetGateways$,
      vpcEndpoints: await vpcEndpoints$,
      vpcPeeringConnections: await vpcPeeringConnections$,
      vpnConnections: await vpnConnections$,
      vpnGateways: await vpnGateways$,
      networkInterfaces: await networkInterfaces$,
      securityGroups: await securityGroups$,
      networkAcls: await networkAcls$,
    };
  }

  private async getVpcs(): Promise<AWS.EC2.Vpc[]> {
    return (await this.ec2.describeVpcs({}).promise()).Vpcs || [];
  }

  private async getSubnets(): Promise<AWS.EC2.Subnet[]> {
    const subnets: AWS.EC2.Subnet[] = [];

    let nextToken: string | undefined;
    do {
      const response = await this.ec2.describeSubnets({
        NextToken: nextToken
      }).promise();

      if (response.Subnets !== undefined) {
        subnets.push(...response.Subnets);
      }

      nextToken = response.NextToken;
    } while (nextToken !== undefined);

    return subnets;
  }

  private async getRouteTables(): Promise<AWS.EC2.RouteTable[]> {
    const routeTables: AWS.EC2.RouteTable[] = [];

    let nextToken: string | undefined;
    do {
      const response = await this.ec2.describeRouteTables({
        NextToken: nextToken,
      }).promise();

      if (response.RouteTables !== undefined) {
        routeTables.push(...response.RouteTables);
      }

      nextToken = response.NextToken;
    } while (nextToken !== undefined);

    return routeTables;
  }

  private async getNatGateways(): Promise<AWS.EC2.NatGateway[]> {
    const natGateways: AWS.EC2.NatGateway[] = [];

    let nextToken: string | undefined;
    do {
      const response = await this.ec2.describeNatGateways({
        NextToken: nextToken,
      }).promise();

      if (response.NatGateways !== undefined) {
        natGateways.push(...response.NatGateways);
      }

      nextToken = response.NextToken;
    } while (nextToken !== undefined);

    return natGateways;
  }

  private async getTransitGateways(): Promise<AWS.EC2.TransitGateway[]> {
    const transitGateways: AWS.EC2.TransitGateway[] = [];

    let nextToken: string | undefined;
    do {
      const response = await this.ec2.describeTransitGateways({
        NextToken: nextToken,
      }).promise();

      if (response.TransitGateways !== undefined) {
        transitGateways.push(...response.TransitGateways);
      }

      nextToken = response.NextToken;
    } while (nextToken !== undefined);

    return transitGateways;
  }

  private async getInternetGateways(): Promise<AWS.EC2.InternetGateway[]> {
    const internetGateways: AWS.EC2.InternetGateway[] = [];

    let nextToken: string | undefined;
    do {
      const response = await this.ec2.describeInternetGateways({
        NextToken: nextToken,
      }).promise();

      if (response.InternetGateways !== undefined) {
        internetGateways.push(...response.InternetGateways);
      }

      nextToken = response.NextToken;
    } while (nextToken !== undefined);

    return internetGateways;
  }

  private async getVpcEndpoints(): Promise<AWS.EC2.VpcEndpoint[]> {
    const vpcEndpoints: AWS.EC2.VpcEndpoint[] = [];

    let nextToken: string | undefined;
    do {
      const response = await this.ec2.describeVpcEndpoints({
        NextToken: nextToken,
      }).promise();

      if (response.VpcEndpoints !== undefined) {
        vpcEndpoints.push(...response.VpcEndpoints);
      }

      nextToken = response.NextToken;
    } while (nextToken !== undefined);

    return vpcEndpoints;
  }

  private async getVpcPeeringConnections(): Promise<AWS.EC2.VpcPeeringConnection[]> {
    const vpcPeeringConnections: AWS.EC2.VpcPeeringConnection[] = [];

    let nextToken: string | undefined;
    do {
      const response = await this.ec2.describeVpcPeeringConnections({
        NextToken: nextToken,
      }).promise();

      if (response.VpcPeeringConnections !== undefined) {
        vpcPeeringConnections.push(...response.VpcPeeringConnections);
      }

      nextToken = response.NextToken;
    } while (nextToken !== undefined);

    return vpcPeeringConnections;
  }

  private async getVpnConnections(): Promise<AWS.EC2.VpnConnection[]> {
    return (await this.ec2.describeVpnConnections({}).promise()).VpnConnections || [];
  }

  private async getVpnGateways(): Promise<AWS.EC2.VpnGateway[]> {
    return (await this.ec2.describeVpnGateways({}).promise()).VpnGateways || [];
  }

  private async getNetworkInterfaces(): Promise<AWS.EC2.NetworkInterface[]> {
    const networkInterfaces: AWS.EC2.NetworkInterface[] = [];

    let nextToken: string | undefined;
    do {
      const response = await this.ec2.describeNetworkInterfaces({
        NextToken: nextToken,
      }).promise();

      if (response.NetworkInterfaces !== undefined) {
        networkInterfaces.push(...response.NetworkInterfaces);
      }

      nextToken = response.NextToken;
    } while (nextToken !== undefined);

    return networkInterfaces;
  }

  private async getSecurityGroups(): Promise<AWS.EC2.SecurityGroup[]> {
    const securityGroups: AWS.EC2.SecurityGroup[] = [];

    let nextToken: string | undefined;
    do {
      const response = await this.ec2.describeSecurityGroups({
        NextToken: nextToken,
      }).promise();

      if (response.SecurityGroups !== undefined) {
        securityGroups.push(...response.SecurityGroups);
      }

      nextToken = response.NextToken;
    } while (nextToken !== undefined);

    return securityGroups;
  }

  private async getNetworkAcls(): Promise<AWS.EC2.NetworkAcl[]> {
    const networkAcls: AWS.EC2.NetworkAcl[] = [];

    let nextToken: string | undefined;
    do {
      const response = await this.ec2.describeNetworkAcls({
        NextToken: nextToken,
      }).promise();

      if (response.NetworkAcls !== undefined) {
        networkAcls.push(...response.NetworkAcls);
      }

      nextToken = response.NextToken;
    } while (nextToken !== undefined);

    return networkAcls;
  }
}
