import { Driver } from '../webdriver/driver';

export class SnapAccountPage {
  constructor(private readonly driver: Driver) {}

  async installSnapSimpleKeyring(isAsyncFlow: boolean): Promise<void> {
    // TODO: Implement the method
    console.log('Installing Snap Simple Keyring');
  }

  async makeNewAccountAndSwitch(): Promise<string> {
    // TODO: Implement the method
    console.log('Making new account and switching');
    return 'newPublicKey';
  }
}
