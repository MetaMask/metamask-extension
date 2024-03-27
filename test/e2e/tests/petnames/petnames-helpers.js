async function rejectSignatureOrTransactionRequest(driver) {
  await driver.clickElement({ text: 'Reject', tag: 'button' });
  await driver.delay(3000);
}

async function focusTestDapp(driver) {
  const windowHandles = await driver.getAllWindowHandles();
  await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
  await driver.delay(3000);
}

async function expectName(driver, expectedValue, isSaved) {
  const containerClass = isSaved ? 'name__saved' : 'name__missing';
  const valueClass = isSaved ? 'name__name' : 'name__value';

  await driver.findElement({
    css: `.${containerClass} .${valueClass}`,
    text: expectedValue,
  });
}

async function clickName(driver, value) {
  await driver.clickElement({
    css: `.name`,
    text: value,
  });
}

async function saveName(driver, value, name, proposedName) {
  await clickName(driver, value);
  await driver.clickElement('.form-combo-field');

  if (proposedName) {
    await driver.clickElement({
      css: '.form-combo-field__option-primary',
      text: proposedName,
    });
  }

  if (name) {
    const input = await driver.findElement('.form-combo-field input');
    await input.fill(name);
    // Pressing enter before saving is needed for firefox to get the dropdown to go away.
    await input.press(driver.Key.ENTER);
  }

  await driver.clickElement({ text: 'Save', tag: 'button' });
}

module.exports = {
  rejectSignatureOrTransactionRequest,
  focusTestDapp,
  expectName,
  clickName,
  saveName,
};
