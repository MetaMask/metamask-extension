const { strict: assert } = require('assert');
const { withFixtures, openDapp, convertToHexValue } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

const ganacheOptions = {
  accounts: [
    {
      secretKey:
        '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
      balance: convertToHexValue(25000000000000000000),
    },
  ],
};

async function loginAndOpenTestDapp(driver) {
  await driver.navigate();
  await driver.fill('#password', 'correct horse battery staple');
  await driver.press('#password', driver.Key.ENTER);
  await openDapp(driver);
}

async function createType4SignatureRequest(driver) {
  await driver.clickElement('#signTypedDataV4');
  await driver.waitUntilXWindowHandles(3);
}

async function rejectSignatureRequest(driver) {
  await driver.clickElement({ text: 'Reject', tag: 'button' });
  await driver.waitUntilXWindowHandles(2);
}

async function focusNotification(driver) {
  const windowHandles = await driver.getAllWindowHandles();
  await driver.switchToWindowWithTitle('MetaMask Notification', windowHandles);
}

async function focusTestDapp(driver) {
  const windowHandles = await driver.getAllWindowHandles();
  await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
}

async function showThirdPartyDetails(driver) {
  const verifyContractDetailsButton = await driver.findElement(
    '.signature-request-content__verify-contract-details',
  );

  verifyContractDetailsButton.click();

  return await driver.findElement('.contract-details-modal');
}

async function closeThirdPartyDetails(driver) {
  await driver.clickElement({ text: 'Got it', tag: 'button' });
}

async function getAddressesInMessage(driver) {
  return await driver.findElements(
    '.signature-request-data__node__value__address',
  );
}

async function expectName(
  parent,
  expectedValue,
  expectedProposedName,
  isSaved,
) {
  const value = await (
    await parent.nestedFindElement(isSaved ? '.name__name' : '.name__value')
  ).getText();

  assert.equal(value, expectedValue, 'Name value is incorrect');

  if (expectedProposedName) {
    const proposedName = (
      await (await parent.nestedFindElement(`.name__proposed`))?.getText()
    )
      ?.replace('“', '')
      .replace('”', '');

    assert.equal(
      proposedName,
      expectedProposedName,
      'Proposed name is incorrect',
    );
  }

  if (isSaved) {
    await parent.nestedFindElement(`.name__saved`);
  } else {
    await parent.nestedFindElement(`.name__missing`);
  }
}

async function saveName(driver, parent, name, proposedName) {
  (await parent.nestedFindElement('.name')).click();
  (await driver.findElement('.form-combo-field')).click();

  if (proposedName) {
    const options = await driver.findElements(
      '.form-combo-field__option-primary',
    );

    let found = false;

    for (const option of options) {
      const text = await option.getText();

      if (text === proposedName) {
        option.click();
        found = true;
        break;
      }
    }

    if (!found) {
      assert.fail('Could not find proposed name');
    }
  }

  if (name) {
    const input = await driver.findElement('.form-combo-field input');
    await input.fill(name);
    await input.press(driver.Key.ENTER);
  }

  await driver.clickElement({ text: 'Save', tag: 'button' });
}

describe('Petnames', function () {
  it('can save names for addresses in type 4 signatures', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPetnamesProposedNames()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await loginAndOpenTestDapp(driver);
        await createType4SignatureRequest(driver);
        await focusNotification(driver);

        let addresses = await getAddressesInMessage(driver);

        await expectName(addresses[0], '0xCD2...D826', undefined, false);
        await expectName(addresses[1], '0xDea...beeF', 'test.eth', false);
        await expectName(addresses[2], '0xbBb...BBbB', 'TestContract', false);
        await expectName(addresses[3], '0xB0B...Ea57', 'TestToken', false);
        await expectName(addresses[4], '0xB0B...0000', 'test.lens', false);

        await saveName(driver, addresses[1], undefined, 'test.eth');
        await saveName(driver, addresses[3], undefined, 'TestToken');

        let contractDetailsModal = await showThirdPartyDetails(driver);

        await expectName(
          contractDetailsModal,
          '0xCcC...cccC',
          'test2.eth',
          false,
        );

        await saveName(driver, contractDetailsModal, 'Custom Name');
        await closeThirdPartyDetails(driver);
        await rejectSignatureRequest(driver);
        await focusTestDapp(driver);
        await createType4SignatureRequest(driver);
        await focusNotification(driver);

        addresses = await getAddressesInMessage(driver);

        await expectName(addresses[1], 'test.eth', undefined, true);
        await expectName(addresses[3], 'TestToken', undefined, true);

        contractDetailsModal = await showThirdPartyDetails(driver);

        await expectName(contractDetailsModal, 'Custom Name', undefined, true);
      },
    );
  });
});
