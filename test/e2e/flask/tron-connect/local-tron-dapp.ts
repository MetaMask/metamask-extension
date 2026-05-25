import { promises as fs } from 'fs';
import { createRequire } from 'module';
import { join } from 'path';
import { tmpdir } from 'os';
import { TronNode } from '../../seeder/tron/node';

const require = createRequire(__filename);

const MAINNET_USDT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const SHASTA_USDT_ADDRESS = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';
const NILE_USDT_ADDRESS = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';
const TEST_DAPP_USDT_ADDRESS = 'TQt64Uww9axWZHXkzUQeguQsNEp1jboS1j';

export async function prepareLocalTronDapp(
  tronNode: TronNode,
): Promise<string> {
  const usdtAddress = tronNode.trc20Tokens.USDT?.address;

  if (!usdtAddress) {
    throw new Error('Local Tron node did not initialize a USDT TRC20 token');
  }

  const packageJsonPath =
    require.resolve('@metamask/test-dapp-tron/package.json');
  const sourceDirectory = join(packageJsonPath, '..', 'dist');
  const destinationDirectory = await fs.mkdtemp(
    join(tmpdir(), 'metamask-local-tron-dapp-'),
  );

  await fs.cp(sourceDirectory, destinationDirectory, { recursive: true });
  await patchDappUsdtAddress(destinationDirectory, usdtAddress);

  return destinationDirectory;
}

async function patchDappUsdtAddress(
  dappDirectory: string,
  usdtAddress: string,
): Promise<void> {
  const assetsDirectory = join(dappDirectory, 'assets');
  const assetFiles = await fs.readdir(assetsDirectory);
  const scriptFiles = assetFiles.filter((file) => file.endsWith('.js'));

  await Promise.all(
    scriptFiles.map(async (scriptFile) => {
      const scriptPath = join(assetsDirectory, scriptFile);
      const source = await fs.readFile(scriptPath, 'utf8');
      const patchedSource = source
        .replaceAll(MAINNET_USDT_ADDRESS, usdtAddress)
        .replaceAll(SHASTA_USDT_ADDRESS, usdtAddress)
        .replaceAll(NILE_USDT_ADDRESS, usdtAddress)
        .replaceAll(TEST_DAPP_USDT_ADDRESS, usdtAddress);

      await fs.writeFile(scriptPath, patchedSource);
    }),
  );
}
