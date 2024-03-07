const LoginPage = require('../page-objects/login.page');

const unlockWallet = async (driver, password) => {
  const loginPage = new LoginPage(driver);

  await driver.navigate();
  await loginPage.addPassword(password);
  await loginPage.unlock();
};

module.exports = unlockWallet;
