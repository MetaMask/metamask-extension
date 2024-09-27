import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { DAPP_URL } from '../../../constants';
import { unlockWallet } from '../../../helpers';
import TestDapp from '../../../page-objects/pages/test-dapp';
import GanacheContractAddressRegistry from '../../../seeder/ganache-contract-address-registry';
import { Driver } from '../../../webdriver/driver';
import { withRedesignConfirmationFixtures } from '../helpers';
import { TestSuiteArguments } from './shared';

const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

const SMART_CONTRACT = SMART_CONTRACTS.HST;

describe('Confirmation Redesign ERC20 Token Send', function () {
  it('Sends a type 0 transaction (Legacy)', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
        await createTransactionAndAssertDetails(driver, contractRegistry);
      },
      mocks,
      SMART_CONTRACT,
    );
  });

  it('Sends a type 2 transaction (EIP1559)', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.feeMarket,
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
        await createTransactionAndAssertDetails(driver, contractRegistry);
      },
      mocks,
      SMART_CONTRACT,
    );
  });
});

async function mocks() {
  return [];
}

async function createTransactionAndAssertDetails(
  driver: Driver,
  contractRegistry?: GanacheContractAddressRegistry,
) {
  await unlockWallet(driver);

  const contractAddress = await (
    contractRegistry as GanacheContractAddressRegistry
  ).getContractAddress(SMART_CONTRACT);

  const testDapp = new TestDapp(driver);

  await testDapp.open({ contractAddress, url: DAPP_URL });

  await driver.delay(1024 ** 2);

  // await testDapp.clickERC1155RevokeSetApprovalForAllButton();

  // await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  // const setApprovalForAllConfirmation =
  //   new SetApprovalForAllTransactionConfirmation(driver);

  // await setApprovalForAllConfirmation.check_revokeSetApprovalForAllTitle();

  // await setApprovalForAllConfirmation.clickScrollToBottomButton();
  // await setApprovalForAllConfirmation.clickFooterConfirmButton();
}
