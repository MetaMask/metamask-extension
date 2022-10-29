const ganacheOptions = {
  accounts: [
    {
      secretKey:
        '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
      balance: 25000000000000000000,
    },
  ],
};

const loadSwaps = async (driver) => {
  await driver.navigate();
  await driver.fill('#password', 'correct horse battery staple');
  await driver.press('#password', driver.Key.ENTER);
  await driver.clickElement(
    '.wallet-overview__buttons .icon-button:nth-child(3)',
  );
};

const buildQuote = async (driver, options) => {
  await driver.clickElement(
    '[class*="dropdown-search-list"] + div[class*="MuiFormControl-root MuiTextField-root"]',
  );
  await driver.fill('input[placeholder*="0"]', options.amount);
  await driver.clickElement(
    '[class="dropdown-search-list__closed-primary-label dropdown-search-list__select-default"]',
  );
  await driver.wait(async () => {
    const tokens = await driver.findElements('.searchable-item-list__item');
    return tokens.length > 1;
  }, 10000);
  await driver.clickElement('.searchable-item-list__labels');
  await driver.clickElement('.dropdown-input-pair__to');
  await driver.clickElement('[placeholder="Search name or paste address"]');
  await driver.fill(
    '[placeholder="Search name or paste address"]',
    options.swapTo,
  );
  await driver.clickElement('.searchable-item-list__primary-label');
};

module.exports = {
  ganacheOptions,
  loadSwaps,
  buildQuote,
};
