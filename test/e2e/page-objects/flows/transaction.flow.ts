import { TransactionParams } from '@metamask/transaction-controller';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import TestDappIndividualRequest from '../pages/test-dapp-individual-request';
import SendAmountRecipientPage from '../pages/send/send-amount-recipient-page';
import SendAssetPickerPage from '../pages/send/send-asset-picker-page';
import SnapSimpleKeyringPage from '../pages/snaps/simple-keyring-page';
import TransactionConfirmation from '../pages/confirmations/transaction-confirmation';

/**
 * Picks the asset on the send asset picker, then sets the recipient on the
 * send form.
 *
 * @param params - An object containing the parameters.
 * @param params.driver - The webdriver instance.
 * @param params.chainId - The chain ID of the asset to send.
 * @param params.symbol - The symbol of the asset to send.
 * @param params.recipientAddress - The recipient address to paste.
 * @param params.recipientName - The account to pick from the recipient modal.
 * @returns The send form page object.
 */
const selectAssetAndRecipient = async ({
  driver,
  chainId,
  symbol,
  recipientAddress,
  recipientName,
}: {
  driver: Driver;
  chainId: string;
  symbol: string;
  recipientAddress?: string;
  recipientName?: string;
}): Promise<SendAmountRecipientPage> => {
  await new SendAssetPickerPage(driver).selectToken(chainId, symbol);
  const sendAmountRecipientPage = new SendAmountRecipientPage(driver);
  if (recipientAddress) {
    await sendAmountRecipientPage.fillRecipient({ recipientAddress });
  }
  if (recipientName) {
    await sendAmountRecipientPage.selectAccountFromRecipientModal(
      recipientName,
    );
  }
  return sendAmountRecipientPage;
};

/**
 * Creates a send request from the send asset picker through Continue.
 *
 * @param params - An object containing the parameters.
 * @param params.driver - The webdriver instance.
 * @param params.chainId - The chain ID of the asset to send.
 * @param params.symbol - The symbol of the asset to send.
 * @param params.recipientAddress - The recipient address to paste.
 * @param params.recipientName - The account to pick from the recipient modal.
 * @param params.amount - The amount to send.
 */
const createSendRequest = async ({
  driver,
  chainId,
  symbol,
  recipientAddress,
  recipientName,
  amount = '0',
}: {
  driver: Driver;
  chainId: string;
  symbol: string;
  recipientAddress?: string;
  recipientName?: string;
  amount?: string;
}): Promise<void> => {
  console.log('Creating send request');
  const sendAmountRecipientPage = await selectAssetAndRecipient({
    driver,
    chainId,
    symbol,
    recipientAddress,
    recipientName,
  });
  await sendAmountRecipientPage.fillAmount(amount);
  await sendAmountRecipientPage.checkAmountInputValue(amount);
  await sendAmountRecipientPage.waitForSendAmountBalance();
  await sendAmountRecipientPage.checkContinueButton({ state: 'enabled' });
  await sendAmountRecipientPage.pressContinueButton();
};

/**
 * Creates a send request for the max amount from the send asset picker
 * through Continue.
 *
 * @param params - An object containing the parameters.
 * @param params.driver - The webdriver instance.
 * @param params.chainId - The chain ID of the asset to send.
 * @param params.symbol - The symbol of the asset to send.
 * @param params.recipientAddress - The recipient address to paste.
 * @param params.recipientName - The account to pick from the recipient modal.
 */
const createMaxSendRequest = async ({
  driver,
  chainId,
  symbol,
  recipientAddress,
  recipientName,
}: {
  driver: Driver;
  chainId: string;
  symbol: string;
  recipientAddress?: string;
  recipientName?: string;
}): Promise<void> => {
  console.log('Creating max send request');
  const sendAmountRecipientPage = await selectAssetAndRecipient({
    driver,
    chainId,
    symbol,
    recipientAddress,
    recipientName,
  });
  await sendAmountRecipientPage.clickMaxButton();
  await sendAmountRecipientPage.waitForSendAmountBalance();
  await sendAmountRecipientPage.checkContinueButton({ state: 'enabled' });
  await sendAmountRecipientPage.pressContinueButton();
};

export const createInternalTransaction = async ({
  driver,
  chainId = '0x539',
  symbol = 'ETH',
  recipientAddress,
  recipientName,
  amount = '1',
}: {
  driver: Driver;
  chainId?: string;
  symbol?: string;
  recipientAddress?: string;
  recipientName?: string;
  amount?: string;
}) => {
  const homePage = new HomePage(driver);
  await homePage.waitForNetworkStatusAvailable();
  await homePage.startSendFlow();

  let respAddress = recipientAddress;
  if (!recipientAddress && !recipientName) {
    respAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
  }

  await createSendRequest({
    driver,
    chainId,
    symbol,
    recipientAddress: respAddress,
    recipientName,
    amount,
  });
};

export const createInternalTransactionWithMaxAmount = async ({
  driver,
  chainId = '0x539',
  symbol = 'ETH',
  recipientAddress,
  recipientName,
}: {
  driver: Driver;
  chainId?: string;
  symbol?: string;
  recipientAddress?: string;
  recipientName?: string;
}) => {
  const homePage = new HomePage(driver);
  await homePage.waitForNetworkStatusAvailable();
  await homePage.startSendFlow();

  let respAddress = recipientAddress;
  if (!recipientAddress && !recipientName) {
    respAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
  }

  await createMaxSendRequest({
    driver,
    chainId,
    symbol,
    recipientAddress: respAddress,
    recipientName,
  });
};

export const createDappTransaction = async (
  driver: Driver,
  override?: Partial<TransactionParams>,
) => {
  const testDappIndividualRequest = new TestDappIndividualRequest(driver);

  await testDappIndividualRequest.request('eth_sendTransaction', [
    {
      data: '0x',
      from: DEFAULT_FIXTURE_ACCOUNT,
      maxFeePerGas: '0x0',
      maxPriorityFeePerGas: '0x0',
      to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
      value: '0x38d7ea4c68000',
      type: '0x2',
      ...override,
    },
  ]);
};

/**
 * This function initiates the steps required to send a transaction from the homepage to final confirmation.
 *
 * @param params - An object containing the parameters.
 * @param params.driver - The webdriver instance.
 * @param params.recipientAddress - The recipient address. Provide this or `recipientName`.
 * @param params.recipientName - The recipient account name. Provide this or `recipientAddress`.
 * @param params.amount - The amount of the asset to be sent in the transaction.
 */
export const sendTransaction = async ({
  driver,
  recipientAddress,
  recipientName,
  amount,
}: {
  driver: Driver;
  amount: string;
} & (
  | { recipientAddress: string; recipientName?: never }
  | { recipientName: string; recipientAddress?: never }
)): Promise<void> => {
  console.log(
    `Start flow to send amount ${amount} to recipient ${recipientAddress ?? recipientName} on home screen`,
  );

  await createInternalTransaction({
    driver,
    recipientAddress,
    recipientName,
    amount,
  });

  // confirm transaction when user lands on confirm transaction screen
  const transactionConfirmation = new TransactionConfirmation(driver);
  await transactionConfirmation.clickFooterButton({ button: 'confirm' });
};

/**
 * This function initiates the steps required to send a transaction from snap account on homepage to final confirmation.
 *
 * @param params - An object containing the parameters.
 * @param params.driver - The webdriver instance.
 * @param params.recipientAddress - The recipient address.
 * @param params.amount - The amount of the asset to be sent in the transaction.
 * @param params.isSyncFlow - Indicates whether synchronous approval option is on for the snap. Defaults to true.
 * @param params.approveTransaction - Indicates whether the transaction should be approved. Defaults to true.
 */
export const sendTransactionWithSnapAccount = async ({
  driver,
  recipientAddress,
  amount,
  isSyncFlow = true,
  approveTransaction = true,
}: {
  driver: Driver;
  recipientAddress: string;
  amount: string;
  isSyncFlow?: boolean;
  approveTransaction?: boolean;
}): Promise<void> => {
  await sendTransaction({
    driver,
    recipientAddress,
    amount,
  });
  if (!isSyncFlow) {
    await new SnapSimpleKeyringPage(driver).approveRejectSnapAccountTransaction(
      approveTransaction,
    );
  }
};
