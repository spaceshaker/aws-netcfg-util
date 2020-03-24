# aws-netcfg-util

![Node.js CI](https://github.com/spaceshaker/aws-netcfg-util/workflows/Node.js%20CI/badge.svg?branch=master)

`aws-netcfg-util` is a command-line tool for for gaining operational insights about AWS network configurations.

## Getting Started

Install the NPM package.
```
npm install -g aws-netcfg-util
```

Downloading AWS network information.

```
aws-netcfg-util download --data-file raw-data.json
```

See below for how to run various reports.

## What can it do?

### Generate an account-level VPC CIDR data dump

```
aws-netcfg-util vpc-cidr --data-file raw-data.json --csv --output-file output.csv
```

### Generate a global VPC CIDR dump

```
aws-netcfg-util global-vpc-cidr --data-file raw-data.json --csv --output-file output.csv --include-default-vpc
```

### Find duplicate/overlaping VPC CIDR blocks

```
aws-netcfg-util global-vpc-cidr --data-file raw-data.json --csv --output-file output.csv --duplicates-only
```
