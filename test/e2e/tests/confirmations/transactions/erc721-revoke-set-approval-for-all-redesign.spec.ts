/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { Mockttp } from '../../../mock-e2e';
import { login } from '../../../page-objects/flows/login.flow';
import { setTokenPermissions } from '../../../page-objects/flows/token-dapp-transactions.flow';
import { withTransactionEnvelopeTypeFixtures } from '../helpers';
import { TestSuiteArguments, mocked4BytesSetApprovalForAll } from './shared';

const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign ERC721 Revoke setApprovalForAll', function () {
  describe('Submit an revoke transaction', function () {
    it('Sends a type 0 transaction (Legacy)', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.legacy,
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          await login(driver, { localNode: localNodes?.[0] });
          await setTokenPermissions(driver, {
            assetType: 'erc721',
            action: 'revoke',
            contractRegistry,
          });
        },
        mocks,
        SMART_CONTRACTS.NFTS,
      );
    });

    it('Sends a type 2 transaction (EIP1559)', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.feeMarket,
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          await login(driver, { localNode: localNodes?.[0] });
          await setTokenPermissions(driver, {
            assetType: 'erc721',
            action: 'revoke',
            contractRegistry,
          });
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
