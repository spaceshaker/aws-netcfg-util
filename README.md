# aws-netcfg-util

`aws-netcfg-util` is a command-line tool for for gaining operational insights about AWS network configurations.

## Getting Started

Install the NPM package.
```
npm install -g aws-netcfg-util
```

Downloading AWS network information.

```
aws-netcfg-util download --output-file output.json
```

Generate a VPC CIDR block report in CSV format.

```
aws-netcfg-util vpc-cidr --csv --input-file output.json --output-file output.csv
```