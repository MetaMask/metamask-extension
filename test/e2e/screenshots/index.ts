import fs from 'fs';
import path from 'path';
import { withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';
import FixtureBuilder from '../fixture-builder';
import { TRADES_API_MOCK_RESULT } from '../../data/mock-data';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { Mockttp } from '../mock-e2e';


const ALL_LOCALES = fs.readdirSync(path.resolve(__dirname, '../../../dist/chrome/_locales'))
  .filter((locale) => !locale.endsWith('.json'));
if (!ALL_LOCALES.includes('en')) {
  throw new Error('English locale not found');
}
const NON_EN_LOCALES = ALL_LOCALES.filter((locale) => locale !== 'en');

async function mockSwapsTransactionQuote(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/1/trades')
      .thenCallback(() => ({
        statusCode: 200,
        json: TRADES_API_MOCK_RESULT,
      })),
  ];
}

const setLocale = async (driver: Driver, locale: string) => {
  await driver.executeScript(
    `metamask.updateCurrentLocale('${locale}');`
  );
  // Wait for the page to load
  await driver.elementCountBecomesN('svg[class="lds-spinner"]', 0);
};

const copyPageAssets = async (pageSource: string, outputDirectory: string) => {
  const pageAssets = [];
  const stylesheets = pageSource.match(/<link[^>]*rel="stylesheet"[^>]*>/g) || [];
  for (const stylesheet of stylesheets) {
    const url = stylesheet.match(/href="([^"]+)"/)?.[1];
    if (url) {
      pageAssets.push(url);
    }
  }
  const images = pageSource.match(/<img[^>]*src="([^"]+)"[^>]*>/g) || [];
  for (const image of images) {
    const urlString = image.match(/src="([^"]+)"/)?.[1];
    if (urlString) {
      if (urlString.startsWith('./')) {
        pageAssets.push(urlString);
      }
    }
  }
  for (const filePath of pageAssets) {
    const inputFilePath = path.resolve(__dirname, '../../../dist/chrome', filePath);
    const outputFilePath = path.resolve(outputDirectory, filePath);
    // console.log(`Copying ${inputFilePath} to ${outputFilePath}`);
    const content = await fs.promises.readFile(inputFilePath, 'utf-8');
    await fs.promises.mkdir(path.dirname(outputFilePath), { recursive: true });
    await fs.promises.writeFile(outputFilePath, content);
  }
};

const savePageHtml = async (driver: Driver, pageFilename: string, outputDirectory: string, saveAssets: boolean = true) => {
  const pageSource = await driver.driver.getPageSource();
  const outputFilePath = path.resolve(outputDirectory, pageFilename);
  await fs.promises.mkdir(path.dirname(outputFilePath), { recursive: true });
  await fs.promises.writeFile(outputFilePath, pageSource);
  if (saveAssets) {
    await copyPageAssets(pageSource, outputDirectory);
  }
};

// Take screenshots and snapshot html with assets of the page in all locales
// Requires lavamoat to be disabled
const takeI18nMegasnap = async (driver: Driver, title: string) => {
  const outputDirectory = driver.getArtifactDir(title);
  // Save english, with assets
  await driver.takeScreenshot(title, `en`);
  await savePageHtml(driver, `en.html`, outputDirectory, true);
  for (const locale of NON_EN_LOCALES) {
    await setLocale(driver, locale);
    // Save locale, without assets
    await driver.takeScreenshot(title, `${locale}`);
    await savePageHtml(driver, `${locale}.html`, outputDirectory, false);
  }
  await setLocale(driver, 'en');
};

describe('Screenshots', function () {
  it('swaps ETH for DAI using a snap account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapsTransactionQuote,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await takeI18nMegasnap(driver, 'home screen');
      },
    );
  });
});
