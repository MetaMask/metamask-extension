import { ERC_4337_ACCOUNT_SNAP_URL, WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';

class SnapAccountAbstractionKeyringPage {
  private readonly addAccountButton = {
    tag: 'button',
    text: 'Add account',
  };

  private readonly bundlerUrlInput = '[data-testid="bundlerUrl"]';

  private readonly chainIdOption1337 = '[data-testid="chain-id-1337"]';

  private readonly chainIdSelect = '[data-testid="chain-select"]';

  private readonly connectButton = '#connectButton';

  private readonly createAccountButton = {
    tag: 'button',
    text: 'Create Account',
  };

  private readonly createAccountLink = {
    text: 'Create account',
  };

  private readonly createAccountPrivateKeyInput = '#create-account-private-key';

  private readonly createAccountSaltInput = '#create-account-salt';

  private readonly createButton = {
    tag: 'button',
    text: 'Create',
  };

  private readonly customVerifyingPaymasterAddressInput =
    '[data-testid="customVerifyingPaymasterAddress"]';

  private readonly customVerifyingPaymasterSKInput =
    '[data-testid="customVerifyingPaymasterSK"]';

  private readonly driver: Driver;

  private readonly entryPointInput = '[data-testid="entryPoint"]';

  private readonly okButton = {
    tag: 'button',
    text: 'Ok',
  };

  private readonly setChainConfigButton = {
    tag: 'button',
    text: 'Set Chain Config',
  };

  private readonly simpleAccountFactoryInput =
    '[data-testid="simpleAccountFactory"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async createAccount(privateKey: string, salt: string): Promise<void> {
    console.log('Create Account Abstraction Snap account');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.ERC4337Snap);
    await this.driver.clickElement(this.createAccountLink);
    await this.driver.fill(this.createAccountPrivateKeyInput, privateKey);
    await this.driver.fill(this.createAccountSaltInput, salt);
    await this.driver.clickElement(this.createAccountButton);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.clickElement(this.createButton);
    await this.driver.clickElement(this.addAccountButton);
    await this.driver.clickElement(this.okButton);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.ERC4337Snap);
  }

  async setChainConfig({
    bundlerUrl,
    entrypoint,
    simpleAccountFactory,
    paymaster,
    paymasterSK,
  }: {
    bundlerUrl: string;
    entrypoint: string;
    simpleAccountFactory: string;
    paymaster?: string;
    paymasterSK?: string;
  }): Promise<void> {
    console.log('Set Account Abstraction Snap chain config');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.ERC4337Snap);
    await this.driver.clickElement(this.chainIdSelect);
    await this.driver.clickElement(this.chainIdOption1337);
    await this.driver.fill(this.bundlerUrlInput, bundlerUrl);
    await this.driver.fill(this.entryPointInput, entrypoint);
    await this.driver.fill(
      this.simpleAccountFactoryInput,
      simpleAccountFactory,
    );

    if (paymaster) {
      await this.driver.fill(
        this.customVerifyingPaymasterAddressInput,
        paymaster,
      );
    }

    if (paymasterSK) {
      await this.driver.fill(this.customVerifyingPaymasterSKInput, paymasterSK);
    }

    await this.driver.clickElement(this.setChainConfigButton);
  }

  async startInstall(
    snapUrl: string = ERC_4337_ACCOUNT_SNAP_URL,
  ): Promise<void> {
    console.log('Start Account Abstraction Snap install');
    await this.driver.openNewPage(snapUrl);
    await this.driver.clickElement(this.connectButton);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  }
}

export default SnapAccountAbstractionKeyringPage;
