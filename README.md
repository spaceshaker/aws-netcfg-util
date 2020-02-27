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

Generate a VPC CIDR block report in CSV format.

```
aws-netcfg-util vpc-cidr --data-file raw-data.json --csv --output-file output.csv
```
