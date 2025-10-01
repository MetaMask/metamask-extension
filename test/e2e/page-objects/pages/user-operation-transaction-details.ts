import { Driver } from '../../webdriver/driver';
import { Bundler } from '../../bundler';

/**
 * Enum for transaction detail row indices in the transaction details view.
 */
enum TransactionDetailRowIndex {
  Nonce = 0,
  GasUsed = 3,
}

/**
 * Page object for User Operation transaction details validation.
 * This extends the basic transaction details functionality with user operation specific validations.
 */
class UserOperationTransactionDetails {
  private readonly driver: Driver;

  private readonly transactionBreakdownRow =
    '[data-testid="transaction-breakdown-row"]';

  private readonly transactionBreakdownRowValue =
    '[data-testid="transaction-breakdown-row-value"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Validates that a specific transaction detail matches the expected text.
   *
   * @param rowIndex - The index of the transaction detail row (0-based)
   * @param expectedText - The expected text value
   */
  async expectTransactionDetail(
    rowIndex: number,
    expectedText: string,
  ): Promise<void> {
    console.log(
      `Validating transaction detail at row ${rowIndex} matches: ${expectedText}`,
    );
    await this.driver.findElement({
      css: `${this.transactionBreakdownRow}:nth-child(${2 + rowIndex}) ${this.transactionBreakdownRowValue}`,
      text: expectedText,
    });
  }

  /**
   * Validates that the transaction details match the user operation receipt from the bundler.
   * This includes checking nonce and gas used values.
   *
   * @param bundlerServer - The bundler server instance to get receipt data from
   */
  async expectTransactionDetailsMatchReceipt(
    bundlerServer: Bundler,
  ): Promise<void> {
    console.log('Validating transaction details match user operation receipt');

    const hexToDecimalString = (hex: string) => String(parseInt(hex, 16));

    // Wait for user operation to be processed and get the hash
    let userOperationHash;
    let attempts = 0;
    const maxAttempts = 10;

    while (!userOperationHash && attempts < maxAttempts) {
      const hashes = await bundlerServer.getUserOperationHashes();
      userOperationHash = hashes[0];

      if (!userOperationHash) {
        console.log(
          `Waiting for user operation hash... attempt ${attempts + 1}/${maxAttempts}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
        attempts += 1;
      }
    }

    if (!userOperationHash) {
      throw new Error('No user operation hash found after waiting');
    }

    // Wait for receipt to be available
    let receipt;
    attempts = 0;

    while (!receipt && attempts < maxAttempts) {
      try {
        receipt =
          await bundlerServer.getUserOperationReceipt(userOperationHash);
        if (!receipt) {
          console.log(
            `Waiting for user operation receipt... attempt ${attempts + 1}/${maxAttempts}`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
          attempts += 1;
        }
      } catch (error) {
        console.log(
          `Error getting receipt, retrying... attempt ${attempts + 1}/${maxAttempts}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
        attempts += 1;
      }
    }

    if (!receipt) {
      throw new Error('No user operation receipt found after waiting');
    }

    // Validate nonce matches
    await this.expectTransactionDetail(
      TransactionDetailRowIndex.Nonce,
      hexToDecimalString(receipt.nonce),
    );

    // Validate gas used matches
    await this.expectTransactionDetail(
      TransactionDetailRowIndex.GasUsed,
      hexToDecimalString(receipt.actualGasUsed),
    );
  }
}

export default UserOperationTransactionDetails;
export { TransactionDetailRowIndex };
