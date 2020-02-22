#!/usr/bin/env node
import 'source-map-support/register';
import {Application} from "../lib/application";

async function main() {
  const app = new Application();
  await app.run();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
