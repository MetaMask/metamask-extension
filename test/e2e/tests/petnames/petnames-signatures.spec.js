const {
  openDapp,
  switchToNotificationWindow,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('../../snaps/enums');
const {
  mockLookupSnap,
} = require('../../mock-response-data/snaps/snap-binary-mocks');
const {
  expectName,
  focusTestDapp,
  saveName,
  clickName,
  rejectRedesignedSignatureOrTransactionRequest,
} = require('./petnames-helpers');

const SIGNATURE_TYPE = {
  TYPED_V3: 'v3',
  TYPED_V4: 'v4',
};

async function openTestSnaps(driver) {
  const handle = await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
  await driver.delay(1000);
  return handle;
}

async function installNameLookupSnap(driver) {
  // Click Connect Button
  const connectButton = await driver.findElement(
    '[data-testid="name-lookup"] button',
  );
  await driver.scrollToElement(connectButton);
  await driver.delay(1000);
  await connectButton.click();
  await driver.delay(1000);

  // Confirm Connect Modal
  await switchToNotificationWindow(driver, 4);
  await driver.clickElement({
    text: 'Connect',
    tag: 'button',
  });

  // Confirm Install Modal
  await driver.clickElement({
    text: 'Confirm',
    tag: 'button',
  });

  // Success Modal
  await driver.clickElement({
    text: 'OK',
    tag: 'button',
  });
}

async function createSignatureRequest(driver, type) {
  const buttonId =
    type === SIGNATURE_TYPE.TYPED_V3 ? '#signTypedDataV3' : '#signTypedDataV4';

  await driver.clickElement(buttonId);
  await driver.delay(3000);
}

async function expectProposedNames(driver, value, options) {
  await clickName(driver, value);
  await driver.clickElement('.form-combo-field');

  for (const option of options) {
    await driver.findElement({
      css: '.form-combo-field__option-primary',
      text: option[0],
    });

    await driver.findElement({
      css: '.form-combo-field__option-secondary',
      text: option[1],
    });
  }
}

describe('Petnames - Signatures', function () {
  it('can save names for addresses in type 3 signatures', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withNoNames()
          .build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await createSignatureRequest(driver, SIGNATURE_TYPE.TYPED_V3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await expectName(driver, '0xCD2a3...DD826', false);
        await expectName(driver, '0xbBbBB...bBBbB', false);
        await saveName(driver, '0xCD2a3...DD826', undefined, 'test.lens');
        await saveName(driver, '0xbBbBB...bBBbB', undefined, 'test2.lens');
        await expectName(driver, '0xCcCCc...ccccC', false);
        await saveName(driver, '0xCcCCc...ccccC', 'Custom Name');
        await rejectRedesignedSignatureOrTransactionRequest(driver);
        await focusTestDapp(driver);
        await createSignatureRequest(driver, SIGNATURE_TYPE.TYPED_V3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await expectName(driver, 'test.lens', true);
        await expectName(driver, 'test2.lens', true);
        await expectName(driver, 'Custom Name', true);
      },
    );
  });

  it('can save names for addresses in type 4 signatures', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withNoNames()
          .build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await createSignatureRequest(driver, SIGNATURE_TYPE.TYPED_V4);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await expectName(driver, '0xCD2a3...DD826', false);
        await expectName(driver, '0xDeaDb...DbeeF', false);
        await expectName(driver, '0xbBbBB...bBBbB', false);
        await expectName(driver, '0xB0Bda...bEa57', false);
        await expectName(driver, '0xB0B0b...00000', false);
        await saveName(driver, '0xCD2a3...DD826', undefined, 'test.lens');
        await saveName(driver, '0xB0Bda...bEa57', undefined, 'Test Token 2');
        await expectName(driver, '0xCcCCc...ccccC', false);
        await saveName(driver, '0xCcCCc...ccccC', 'Custom Name');
        await rejectRedesignedSignatureOrTransactionRequest(driver);
        await focusTestDapp(driver);
        await createSignatureRequest(driver, SIGNATURE_TYPE.TYPED_V4);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await expectName(driver, 'test.lens', true);
        await expectName(driver, 'Test Toke...', true);
        await expectName(driver, 'Custom Name', true);
      },
    );
  });

  it('can propose names using installed snaps', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withNoNames()
          .build(),
        testSpecificMock: mockLookupSnap,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await openTestSnaps(driver);
        await installNameLookupSnap(driver);
        await focusTestDapp(driver);
        await createSignatureRequest(driver, SIGNATURE_TYPE.TYPED_V4);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await expectProposedNames(driver, '0xCD2a3...DD826', [
          ['test.lens', 'Lens Protocol'],
          ['cd2.1337.test.domain', 'Name Lookup Example Snap'],
        ]);
      },
    );
  });
});
