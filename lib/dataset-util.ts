import {promisify} from "util";
import * as fs from "fs";
import {MultiAccountNetworkConfigDataset} from "./multi-account-network-config-dataset";

const writeFile$ = promisify(fs.writeFile);
const readFile$ = promisify(fs.readFile);

export async function loadDataset(outputFile: string): Promise<MultiAccountNetworkConfigDataset> {
  const result = await readFile$(outputFile);
  return JSON.parse(result.toString());
}

export async function saveDataset(outputFile: string, dataset: MultiAccountNetworkConfigDataset): Promise<void> {
  await writeFile$(outputFile, JSON.stringify(dataset));
}
