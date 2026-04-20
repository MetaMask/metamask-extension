import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { Context, Suite } from 'mocha';
import type { Locator, WebElement } from 'selenium-webdriver';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withProductionFixtures } from '../../helpers/prod-with-fixtures';
import { Driver } from '../../../webdriver/driver';
import { PROD_DELAYS } from '../../helpers/prod-test-helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import { switchToEditRPCViaGlobalMenuNetworks } from '../../../page-objects/flows/network.flow';
import SelectNetwork from '../../../page-objects/pages/dialog/select-network';
import AddEditNetworkModal from '../../../page-objects/pages/dialog/add-edit-network';
import AddNetworkRpcUrlModal from '../../../page-objects/pages/dialog/add-network-rpc-url';
import HomePage from '../../../page-objects/pages/home/homepage';
import { NETWORK_CONFIGS, NetworkConfig } from './network-configs';


type NetworkNativeValidationResult = {
  networkId: string;
  networkName: string;
  chainId: number;
  symbol: string;
  currentNetworkDisplay?: string;
  logoSelector: string;
  nativeLogoPresent: boolean;
  nativeAssetTitle?: string;
  nativeBalanceText?: string;
  nativeBalancePresent: boolean;
  nativeFiatText?: string;
  nativeFiatPresent: boolean;
  nativeFiatAvailable: boolean;
  native24hChangeText?: string;
  native24hChangePresent: boolean;
  native24hChangeAvailable: boolean;
  overallStatus: 'passed' | 'failed';
  warnings: string[];
  errorMessage?: string;
  duration: number;
  timestamp: string;
};


type NativeAssetRowSnapshot = {
  titleText: string;
  balanceText: string;
  fiatText: string;
  changePercentageText: string;
};


type CleanAppState = {
  metamask?: {
    providerConfig?: {
      nickname?: string;
    };
    selectedNetworkClientId?: string;
    networkConfigurationsByChainId?: Record<
      string,
      {
        name?: string;
        rpcEndpoints?: {
          networkClientId?: string;
        }[];
      }
    >;
  };
};


const ASSET_TAB_SELECTOR = '[data-testid="account-overview__asset-tab"]';
const NATIVE_ASSET_ROW_SELECTOR =
  '[data-testid="multichain-token-list-button"]';
const NATIVE_ASSET_TITLE_SELECTOR =
  '[data-testid="multichain-token-list-item-token-name"]';
const NATIVE_ASSET_BALANCE_SELECTOR =
  '[data-testid="multichain-token-list-item-value"]';
const NATIVE_ASSET_FIAT_SELECTOR =
  '[data-testid="multichain-token-list-item-secondary-value"]';
const NATIVE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';


const allNetworkResults: NetworkNativeValidationResult[] = [];


function normalizeText(value: string): string {
  return value.trim().replace(/\s+/gu, ' ').toLowerCase();
}


function doesNetworkDisplayMatch(actual: string, expected: string): boolean {
  const normalizedActual = normalizeText(actual);
  const normalizedExpected = normalizeText(expected);


  return (
    normalizedActual === normalizedExpected ||
    normalizedActual.includes(normalizedExpected) ||
    normalizedExpected.includes(normalizedActual)
  );
}


function doesBalanceMatchSymbol(balanceText: string, symbol: string): boolean {
  return normalizeText(balanceText).endsWith(` ${symbol.trim().toLowerCase()}`);
}


function hasRenderableData(value: string): boolean {
  const normalizedValue = value.trim();


  return (
    normalizedValue !== '' && normalizedValue !== '-' && normalizedValue !== '—'
  );
}


function getNativeLogoSelector(symbol: string): string {
  return `img[alt="${symbol} logo"]`;
}


function getNative24hChangeSelector(): string {
  return `[data-testid="token-increase-decrease-percentage-${NATIVE_TOKEN_ADDRESS}"]`;
}


async function getFirstMatchingElementText(
  driver: Driver,
  selector: string,
): Promise<string> {
  const locator = driver.buildLocator(selector) as unknown as Locator;
  const elements = await driver.driver.findElements(locator);


  if (!elements.length) {
    return '';
  }


  const text = (await elements[0].getText()).trim();
  if (text) {
    return text;
  }


  if (selector === '.mm-picker-network') {
    return ((await elements[0].getAttribute('aria-label')) ?? '').trim();
  }


  return '';
}


async function getFirstNestedElementText(
  driver: Driver,
  element: WebElement,
  selector: string,
): Promise<string> {
  const locator = driver.buildLocator(selector) as unknown as Locator;
  const elements = await element.findElements(locator);


  if (!elements.length) {
    return '';
  }


  return (await elements[0].getText()).trim();
}


async function getCurrentNetworkDisplayName(driver: Driver): Promise<string> {
  const state = (await driver.executeScript(() => {
    return (
      globalThis as {
        stateHooks?: {
          getCleanAppState?: () => Promise<CleanAppState | undefined>;
        };
      }
    ).stateHooks?.getCleanAppState?.();
  })) as CleanAppState | undefined;


  const providerNickname = state?.metamask?.providerConfig?.nickname?.trim();
  if (providerNickname) {
    return providerNickname;
  }


  const selectedNetworkClientId = state?.metamask?.selectedNetworkClientId;
  const networkConfigurationsByChainId =
    state?.metamask?.networkConfigurationsByChainId;


  if (selectedNetworkClientId && networkConfigurationsByChainId) {
    for (const networkConfiguration of Object.values(
      networkConfigurationsByChainId,
    )) {
      if (
        networkConfiguration?.rpcEndpoints?.some(
          (rpcEndpoint) =>
            rpcEndpoint.networkClientId === selectedNetworkClientId,
        ) &&
        networkConfiguration.name?.trim()
      ) {
        return networkConfiguration.name.trim();
      }
    }
  }


  const selectors = [
    '[data-testid="picker-network-label"]',
    '[data-testid="networks-subtitle-test-id"]',
    '[data-testid="network-display"]',
    '.mm-picker-network',
  ];


  for (const selector of selectors) {
    const text = await getFirstMatchingElementText(driver, selector);
    if (text) {
      return text;
    }
  }


  throw new Error(
    'Could not determine the current network display name from supported selectors',
  );
}


async function isSelectorPresent(
  driver: Driver,
  selector: string,
): Promise<boolean> {
  const locator = driver.buildLocator(selector) as unknown as Locator;
  const elements = await driver.driver.findElements(locator);


  return elements.length > 0;
}


async function isNestedSelectorPresent(
  driver: Driver,
  element: WebElement,
  selector: string,
): Promise<boolean> {
  const locator = driver.buildLocator(selector) as unknown as Locator;
  const elements = await element.findElements(locator);


  return elements.length > 0;
}


async function waitForNativeLogoPresence(
  driver: Driver,
  symbol: string,
): Promise<boolean> {
  const selector = getNativeLogoSelector(symbol);


  try {
    await driver.waitUntil(
      async () => await isSelectorPresent(driver, selector),
      {
        timeout: PROD_DELAYS.TOKEN_BALANCE_UPDATE,
        interval: 500,
      },
    );


    return true;
  } catch {
    return await isSelectorPresent(driver, selector);
  }
}


async function getNativeAssetRowSnapshot(
  driver: Driver,
  symbol: string,
): Promise<NativeAssetRowSnapshot | null> {
  const rowLocator = driver.buildLocator(
    NATIVE_ASSET_ROW_SELECTOR,
  ) as unknown as Locator;
  const rows = await driver.driver.findElements(rowLocator);
  const native24hChangeSelector = getNative24hChangeSelector();


  for (const row of rows) {
    const titleText = await getFirstNestedElementText(
      driver,
      row,
      NATIVE_ASSET_TITLE_SELECTOR,
    );
    const balanceText = await getFirstNestedElementText(
      driver,
      row,
      NATIVE_ASSET_BALANCE_SELECTOR,
    );
    const fiatText = await getFirstNestedElementText(
      driver,
      row,
      NATIVE_ASSET_FIAT_SELECTOR,
    );
    const changePercentageText = await getFirstNestedElementText(
      driver,
      row,
      native24hChangeSelector,
    );
    const hasNativeLogo = await isNestedSelectorPresent(
      driver,
      row,
      getNativeLogoSelector(symbol),
    );
    const hasNative24hChange = await isNestedSelectorPresent(
      driver,
      row,
      native24hChangeSelector,
    );
    const balanceMatchesSymbol = doesBalanceMatchSymbol(balanceText, symbol);


    if (balanceMatchesSymbol || hasNativeLogo || hasNative24hChange) {
      return {
        titleText,
        balanceText,
        fiatText,
        changePercentageText,
      };
    }
  }


  return null;
}


async function waitForNativeAssetRowSnapshot(
  driver: Driver,
  symbol: string,
): Promise<NativeAssetRowSnapshot | null> {
  try {
    await driver.waitUntil(
      async () => {
        const snapshot = await getNativeAssetRowSnapshot(driver, symbol);
        return Boolean(snapshot?.balanceText);
      },
      {
        timeout: PROD_DELAYS.TOKEN_BALANCE_UPDATE,
        interval: 500,
      },
    );
  } catch {
    // Soft validation below will record whatever data is available.
  }


  return await getNativeAssetRowSnapshot(driver, symbol);
}


function generateNativeValidationReport(
  results: NetworkNativeValidationResult[],
  reportPath: string,
): void {
  if (!results.length) {
    console.warn('[PROD TEST] ⚠️  No results to generate report from');
    return;
  }


  const passedNetworks = results.filter(
    (result) => result.overallStatus === 'passed',
  ).length;
  const logoPresentCount = results.filter(
    (result) => result.nativeLogoPresent,
  ).length;
  const nativeBalancePresentCount = results.filter(
    (result) => result.nativeBalancePresent,
  ).length;
  const nativeFiatPresentCount = results.filter(
    (result) => result.nativeFiatPresent,
  ).length;
  const nativeFiatAvailableCount = results.filter(
    (result) => result.nativeFiatAvailable,
  ).length;
  const native24hPresentCount = results.filter(
    (result) => result.native24hChangePresent,
  ).length;
  const native24hAvailableCount = results.filter(
    (result) => result.native24hChangeAvailable,
  ).length;


  const lines: string[] = [];
  lines.push('# Network Import Native Asset Validation Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Total Networks Tested | ${results.length} |`);
  lines.push(`| Passed Networks | ${passedNetworks} |`);
  lines.push(`| Failed Networks | ${results.length - passedNetworks} |`);
  lines.push(`| Native Logos Present | ${logoPresentCount} |`);
  lines.push(`| Native Balances Present | ${nativeBalancePresentCount} |`);
  lines.push(`| Native Fiat Fields Present | ${nativeFiatPresentCount} |`);
  lines.push(`| Native Fiat Values Available | ${nativeFiatAvailableCount} |`);
  lines.push(`| Native 24h Fields Present | ${native24hPresentCount} |`);
  lines.push(`| Native 24h Values Available | ${native24hAvailableCount} |`);
  lines.push('');
  lines.push('## Network Results');
  lines.push('');
  lines.push(
    '| Network | Chain ID | Symbol | Status | Active Network Display | Native Logo | Native Balance | Native Fiat | Native 24h Change | Warning | Error |',
  );
  lines.push(
    '|---------|----------|--------|--------|------------------------|-------------|----------------|-------------|-------------------|---------|-------|',
  );


  results.forEach((result) => {
    const warningText =
      result.warnings.length > 0
        ? escapeMarkdown(result.warnings.join('; '))
        : '—';
    const errorText = result.errorMessage
      ? escapeMarkdown(result.errorMessage)
      : '—';


    lines.push(
      `| ${escapeMarkdown(result.networkName)} | \`${result.chainId}\` | ${escapeMarkdown(result.symbol)} | ${result.overallStatus === 'passed' ? '✅ Passed' : '❌ Failed'} | ${escapeMarkdown(result.currentNetworkDisplay || '—')} | ${result.nativeLogoPresent ? '✅ Present' : '⚠️ Missing'} | ${escapeMarkdown(result.nativeBalanceText || '—')} | ${escapeMarkdown(result.nativeFiatText || '—')} | ${escapeMarkdown(result.native24hChangeText || '—')} | ${warningText} | ${errorText} |`,
    );
  });


  lines.push('');
  lines.push('## Details');
  lines.push('');


  results.forEach((result, index) => {
    lines.push(`### ${index + 1}. ${result.networkName}`);
    lines.push('');
    lines.push(`- **Chain ID:** \`${result.chainId}\``);
    lines.push(`- **Symbol:** ${result.symbol}`);
    lines.push(`- **Status:** ${result.overallStatus}`);
    lines.push(`- **Native Logo Selector:** \`${result.logoSelector}\``);
    lines.push(
      `- **Native Logo Present:** ${result.nativeLogoPresent ? 'Yes' : 'No'}`,
    );
    lines.push(
      `- **Active Network Display:** ${result.currentNetworkDisplay || 'N/A'}`,
    );
    lines.push(`- **Native Asset Title:** ${result.nativeAssetTitle || 'N/A'}`);
    lines.push(`- **Native Balance:** ${result.nativeBalanceText || 'N/A'}`);
    lines.push(
      `- **Native Balance Present:** ${result.nativeBalancePresent ? 'Yes' : 'No'}`,
    );
    lines.push(`- **Native Fiat:** ${result.nativeFiatText || 'N/A'}`);
    lines.push(
      `- **Native Fiat Present:** ${result.nativeFiatPresent ? 'Yes' : 'No'}`,
    );
    lines.push(
      `- **Native Fiat Available:** ${result.nativeFiatAvailable ? 'Yes' : 'No'}`,
    );
    lines.push(
      `- **Native 24h Change:** ${result.native24hChangeText || 'N/A'}`,
    );
    lines.push(
      `- **Native 24h Change Present:** ${result.native24hChangePresent ? 'Yes' : 'No'}`,
    );
    lines.push(
      `- **Native 24h Change Available:** ${result.native24hChangeAvailable ? 'Yes' : 'No'}`,
    );
    lines.push(`- **Duration:** ${(result.duration / 1000).toFixed(2)}s`);
    lines.push(`- **Timestamp:** ${result.timestamp}`);


    if (result.warnings.length > 0) {
      lines.push(`- **Warnings:** ${result.warnings.join('; ')}`);
    }


    if (result.errorMessage) {
      lines.push(`- **Error:** ${result.errorMessage}`);
    }


    lines.push('');
  });


  const reportDirectory = path.dirname(reportPath);
  if (!fs.existsSync(reportDirectory)) {
    fs.mkdirSync(reportDirectory, { recursive: true });
  }


  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
}


function escapeMarkdown(value: string): string {
  return value
    .replace(/\|/gu, '\\|')
    .replace(/\n/gu, '\\n')
    .replace(/\[/gu, '\\[')
    .replace(/\]/gu, '\\]');
}


async function runNetworkImportNativeValidationTest(
  networkConfig: NetworkConfig,
  testContext: Context,
): Promise<NetworkNativeValidationResult> {
  const startedAt = Date.now();
  const result: NetworkNativeValidationResult = {
    networkId: networkConfig.networkId,
    networkName: networkConfig.networkName,
    chainId: networkConfig.chainId,
    symbol: networkConfig.symbol,
    logoSelector: getNativeLogoSelector(networkConfig.symbol),
    nativeLogoPresent: false,
    nativeBalancePresent: false,
    nativeFiatPresent: false,
    nativeFiatAvailable: false,
    native24hChangePresent: false,
    native24hChangeAvailable: false,
    overallStatus: 'passed',
    warnings: [],
    duration: 0,
    timestamp: new Date().toISOString(),
  };


  try {
    await withProductionFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
        title:
          testContext.test?.fullTitle() ??
          `${networkConfig.networkName} network import native asset validation`,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);


        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();


        console.log(
          `[PROD TEST] Starting ${networkConfig.networkName} network import for native asset validation...`,
        );


        await switchToEditRPCViaGlobalMenuNetworks(driver);


        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.openAddCustomNetworkModal();


        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.checkPageIsLoaded();
        await addEditNetworkModal.fillNetworkNameInputField(
          networkConfig.networkName,
        );
        await addEditNetworkModal.fillNetworkChainIdInputField(
          networkConfig.chainId.toString(),
        );
        await addEditNetworkModal.fillCurrencySymbolInputField(
          networkConfig.symbol,
        );
        await addEditNetworkModal.openAddRpcUrlModal();


        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.checkPageIsLoaded();
        await driver.delay(PROD_DELAYS.RPC_RESPONSE * 2);
        await addRpcUrlModal.fillAddRpcUrlInput(networkConfig.rpcUrl);
        await addRpcUrlModal.fillAddRpcNameInput(networkConfig.rpcName);
        await driver.delay(PROD_DELAYS.RPC_RESPONSE);
        await addRpcUrlModal.saveAddRpcUrl();


        await addEditNetworkModal.saveEditedNetwork();


        await homePage.checkPageIsLoaded();
        await homePage.checkAddNetworkMessageIsDisplayed(
          networkConfig.networkName,
        );


        await driver.delay(PROD_DELAYS.RPC_RESPONSE);
        await driver.waitUntil(
          async () => {
            result.currentNetworkDisplay =
              await getCurrentNetworkDisplayName(driver);


            return doesNetworkDisplayMatch(
              result.currentNetworkDisplay,
              networkConfig.networkName,
            );
          },
          {
            timeout: PROD_DELAYS.RPC_RESPONSE * 3,
            interval: 500,
          },
        );


        console.log(
          `[PROD TEST] Current network display: ${result.currentNetworkDisplay}`,
        );


        await driver.clickElement(ASSET_TAB_SELECTOR);


        result.nativeLogoPresent = await waitForNativeLogoPresence(
          driver,
          networkConfig.symbol,
        );


        if (result.nativeLogoPresent) {
          console.log(
            `[PROD TEST] ✅ Native logo found with selector ${result.logoSelector}`,
          );
        } else {
          const warning = `Native logo not found with selector ${result.logoSelector}`;
          result.warnings.push(warning);
          console.log(`[PROD TEST] ⚠️  ${warning}`);
        }


        const nativeAssetSnapshot = await waitForNativeAssetRowSnapshot(
          driver,
          networkConfig.symbol,
        );


        if (nativeAssetSnapshot) {
          result.nativeAssetTitle = nativeAssetSnapshot.titleText || undefined;
          result.nativeBalanceText =
            nativeAssetSnapshot.balanceText || undefined;
          result.nativeFiatText = nativeAssetSnapshot.fiatText || undefined;
          result.native24hChangeText =
            nativeAssetSnapshot.changePercentageText || undefined;
          result.nativeBalancePresent = hasRenderableData(
            nativeAssetSnapshot.balanceText,
          );
          result.nativeFiatPresent = nativeAssetSnapshot.fiatText.trim() !== '';
          result.nativeFiatAvailable = hasRenderableData(
            nativeAssetSnapshot.fiatText,
          );
          result.native24hChangePresent =
            nativeAssetSnapshot.changePercentageText.trim() !== '';
          result.native24hChangeAvailable = hasRenderableData(
            nativeAssetSnapshot.changePercentageText,
          );


          console.log(
            `[PROD TEST] Native asset row: title=${result.nativeAssetTitle || 'N/A'}, balance=${result.nativeBalanceText || 'N/A'}, fiat=${result.nativeFiatText || 'N/A'}, 24h=${result.native24hChangeText || 'N/A'}`,
          );


          if (result.nativeBalancePresent) {
            console.log(
              `[PROD TEST] ✅ Native balance found: ${result.nativeBalanceText}`,
            );
          } else {
            const warning = 'Native balance text not found in the asset list';
            result.warnings.push(warning);
            console.log(`[PROD TEST] ⚠️  ${warning}`);
          }


          if (result.nativeFiatPresent) {
            if (result.nativeFiatAvailable) {
              console.log(
                `[PROD TEST] ✅ Native fiat value found: ${result.nativeFiatText}`,
              );
            } else {
              const warning = `Native fiat value unavailable: ${result.nativeFiatText}`;
              result.warnings.push(warning);
              console.log(`[PROD TEST] ⚠️  ${warning}`);
            }
          } else {
            const warning =
              'Native fiat value element not found in the asset list';
            result.warnings.push(warning);
            console.log(`[PROD TEST] ⚠️  ${warning}`);
          }


          if (result.native24hChangePresent) {
            if (result.native24hChangeAvailable) {
              console.log(
                `[PROD TEST] ✅ Native 24h change found: ${result.native24hChangeText}`,
              );
            } else {
              const warning = `Native 24h change unavailable: ${result.native24hChangeText}`;
              result.warnings.push(warning);
              console.log(`[PROD TEST] ⚠️  ${warning}`);
            }
          } else {
            const warning =
              'Native 24h change element not found in the asset list';
            result.warnings.push(warning);
            console.log(`[PROD TEST] ⚠️  ${warning}`);
          }
        } else {
          const warning =
            'Could not find the native asset row in the asset list';
          result.warnings.push(warning);
          console.log(`[PROD TEST] ⚠️  ${warning}`);
        }
      },
    );
  } catch (error) {
    result.overallStatus = 'failed';
    result.errorMessage =
      error instanceof Error ? error.message : String(error);
  }


  result.duration = Date.now() - startedAt;
  return result;
}


describe('Production E2E: Import Networks And Record Native Asset Validation', function (this: Suite) {
  this.timeout(14400000);


  NETWORK_CONFIGS.forEach((networkConfig) => {
    it(`imports ${networkConfig.networkName} and records native asset validation`, async function () {
      this.timeout(900000);


      const result = await runNetworkImportNativeValidationTest(
        networkConfig,
        this,
      );
      allNetworkResults.push(result);


      generateNativeValidationReport(
        allNetworkResults,
        'test/e2e/prod/tests/tokens/network-import-native-logo-report.md',
      );


      assert.equal(
        result.overallStatus,
        'passed',
        result.errorMessage ??
          `Network import failed for ${networkConfig.networkName}`,
      );
    });
  });
});


