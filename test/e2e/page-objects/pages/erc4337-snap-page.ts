import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../helpers';

/**
 * Page object for ERC-4337 Account Abstraction Snap interactions.
 * This page handles the snap's dapp interface for creating accounts and configuring settings.
 */
class ERC4337SnapPage {
  private readonly driver: Driver;

  // Selectors for snap configuration and account creation
  private readonly addAccountButton = { text: 'Add account', tag: 'button' };

  private readonly bundlerUrlInput = '[data-testid="bundlerUrl"]';

  private readonly chainId1337 = '[data-testid="chain-id-1337"]';

  private readonly chainSelect = '[data-testid="chain-select"]';

  private readonly createAccountButton = { text: 'Create account' };

  private readonly createAccountPrivateKeyInput = '#create-account-private-key';

  private readonly createAccountSaltInput = '#create-account-salt';

  private readonly createAccountSubmitButton = {
    text: 'Create Account',
    tag: 'button',
  };

  private readonly createButton = { text: 'Create', tag: 'button' };

  private readonly customVerifyingPaymasterAddressInput =
    '[data-testid="customVerifyingPaymasterAddress"]';

  private readonly customVerifyingPaymasterSKInput =
    '[data-testid="customVerifyingPaymasterSK"]';

  private readonly entryPointInput = '[data-testid="entryPoint"]';

  private readonly okButton = { text: 'Ok', tag: 'button' };

  private readonly setChainConfigButton = {
    text: 'Set Chain Config',
    tag: 'button',
  };

  private readonly simpleAccountFactoryInput =
    '[data-testid="simpleAccountFactory"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Connects to the snap by clicking the connect button.
   */
  async connectToSnap(): Promise<void> {
    console.log('Connecting to ERC-4337 snap');
    await this.driver.clickElement('#connectButton');
  }

  /**
   * Creates a new snap account with the provided private key and salt.
   *
   * @param privateKey - The private key for the account
   * @param salt - The salt for account creation
   */
  async createSnapAccount(privateKey: string, salt: string): Promise<void> {
    console.log('Creating snap account');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.ERC4337Snap);

    // Click create account and fill details
    await this.driver.clickElement(this.createAccountButton);
    await this.driver.fill(this.createAccountPrivateKeyInput, privateKey);
    await this.driver.fill(this.createAccountSaltInput, salt);
    await this.driver.clickElement(this.createAccountSubmitButton);

    // Handle dialog confirmations
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.clickElement(this.createButton);
    await this.driver.clickElement(this.addAccountButton);
    await this.driver.clickElement(this.okButton);

    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.ERC4337Snap);
  }

  /**
   * Opens the ERC-4337 snap page and waits for it to load.
   *
   * @param snapUrl - The URL of the ERC-4337 snap dapp
   */
  async openSnapPage(snapUrl: string): Promise<void> {
    console.log('Opening ERC-4337 Account Abstraction Snap page');
    await this.driver.openNewPage(snapUrl);
  }

  /**
   * Configures the snap with the provided settings.
   *
   * @param config - Configuration object for the snap
   * @param config.bundlerUrl - The bundler URL
   * @param config.entrypoint - The entry point address
   * @param config.simpleAccountFactory - The simple account factory address
   * @param config.paymaster - Optional paymaster address
   * @param config.paymasterSK - Optional paymaster secret key
   */
  async setSnapConfiguration(config: {
    bundlerUrl: string;
    entrypoint: string;
    simpleAccountFactory: string;
    paymaster?: string;
    paymasterSK?: string;
  }): Promise<void> {
    console.log('Setting snap configuration');
    await this.driver.switchToWindowWithTitle('Account Abstraction Snap');

    // Select chain
    await this.driver.clickElement(this.chainSelect);
    await this.driver.clickElement(this.chainId1337);

    // Fill configuration fields
    await this.driver.fill(this.bundlerUrlInput, config.bundlerUrl);
    await this.driver.fill(this.entryPointInput, config.entrypoint);
    await this.driver.fill(
      this.simpleAccountFactoryInput,
      config.simpleAccountFactory,
    );

    if (config.paymaster) {
      await this.driver.fill(
        this.customVerifyingPaymasterAddressInput,
        config.paymaster,
      );
    }

    if (config.paymasterSK) {
      await this.driver.fill(
        this.customVerifyingPaymasterSKInput,
        config.paymasterSK,
      );
    }

    await this.driver.clickElement(this.setChainConfigButton);
  }
}

export default ERC4337SnapPage;
