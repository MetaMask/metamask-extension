/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { unlockWallet } from '../../../helpers';
import { Mockttp } from '../../../mock-e2e';
import {
  assertRevokeSetApprovalForAllTitle,
  createERC1155RevokeSetApprovalForAllTransaction,
  scrollToBottomOfConfirmationAndConfirm,
} from '../../../page-objects/flows/transaction-redesign.flow';
import GanacheContractAddressRegistry from '../../../seeder/ganache-contract-address-registry';
import { Driver } from '../../../webdriver/driver';
import { withRedesignConfirmationFixtures } from '../helpers';
import { mocked4BytesSetApprovalForAll } from './erc721-revoke-set-approval-for-all-redesign';
import { TestSuiteArguments } from './shared';

const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign ERC1155 Revoke setApprovalForAll', function () {
  describe('Submit an revoke transaction @no-mmi', function () {
    it('Sends a type 0 transaction (Legacy)', async function () {
      await withRedesignConfirmationFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.legacy,
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await createTransactionAndAssertDetails(driver, contractRegistry);
        },
        mocks,
        SMART_CONTRACTS.NFTS,
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
        SMART_CONTRACTS.NFTS,
      );
    });
  });
});

async function mocks(server: Mockttp) {
  return [await mocked4BytesSetApprovalForAll(server)];
}

async function createTransactionAndAssertDetails(
  driver: Driver,
  contractRegistry?: GanacheContractAddressRegistry,
) {
  await unlockWallet(driver);

  const contractAddress = await (
    contractRegistry as GanacheContractAddressRegistry
  ).getContractAddress(SMART_CONTRACTS.NFTS);

  await createERC1155RevokeSetApprovalForAllTransaction(
    driver,
    contractAddress,
  );

  await assertRevokeSetApprovalForAllTitle(driver);

  await scrollToBottomOfConfirmationAndConfirm(driver);
}
