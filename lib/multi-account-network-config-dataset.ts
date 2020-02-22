import {Account} from "./account";

export interface MultiAccountNetworkConfigDataset {
  accounts: { [key: string]: Account };
}
