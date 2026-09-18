import { Driver } from '../../../webdriver/driver';

/**
 * Bitcoin snap confirmation for dapp sign / PSBT / send requests.
 *
 * Screen: snap-rendered confirmation dialog (not a MetaMask `#/confirmation`
 * route of its own).
 * Owns: clicking Approve on the snap confirmation.
 * Boundaries: content is owned by the Bitcoin snap UI. EVM redesigned
 * confirmations and other snap sign/tx page objects are separate.
 * Related: Flask btc-wallet-standard E2E flows that open this dialog.
 *
 * @see ui/components/app/snaps/snap-ui-footer-button/snap-ui-footer-button.tsx
 * @see ui/components/app/snaps/snap-ui-renderer/components/footer.ts
 */
class BitcoinDappConfirmation {
  private readonly approveButton = { text: 'Approve' };

  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickApprove(): Promise<void> {
    await this.driver.clickElement(this.approveButton);
  }
}

export default BitcoinDappConfirmation;
