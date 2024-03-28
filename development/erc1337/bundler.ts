import { Bundler } from '../../test/e2e/bundler';

async function main() {
  await new Bundler().start();
}

main();
