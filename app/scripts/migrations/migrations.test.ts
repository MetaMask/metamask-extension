import wallet1 from '../../../test/lib/migrations/001.json';
import vault4 from '../../../test/lib/migrations/004.json';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import migration2 from './002';
import migration3 from './003';
import migration4 from './004';
import migration5 from './005';
import migration6 from './006';
import migration7 from './007';
import migration8 from './008';
import migration9 from './009';
import migration10 from './010';
import migration11 from './011';
import migration12 from './012';
import migration13 from './013';

type Vault4Data = (typeof vault4)['data'];

type LegacyTestData = Vault4Data & {
  currentFiat?: string;
  config: Vault4Data['config'] & {
    provider: Vault4Data['config']['provider'] & {
      rpcTarget?: string | null;
    };
    selectedAccount?: string;
  };
} & Record<
    'KeyringController',
    {
      vault?: Vault4Data['vault'];
      selectedAccount?: Vault4Data['config']['selectedAccount'];
      walletNicknames?: Vault4Data['walletNicknames'];
    }
  > &
  Partial<
    Record<
      'PreferencesController',
      {
        selectedAddress?: string;
      }
    >
  > &
  Record<
    'TransactionManager',
    {
      transactions: Vault4Data['transactions'];
      gasMultiplier: Vault4Data['gasMultiplier'];
    }
  > &
  Record<
    'NoticeController',
    {
      noticesList: Vault4Data['noticesList'];
    }
  > &
  Record<
    'CurrencyController',
    {
      currentCurrency: string;
      conversionRate: Vault4Data['conversionRate'];
      conversionDate: Vault4Data['conversionDate'];
    }
  > &
  Record<
    'ShapeShiftController',
    {
      shapeShiftTxList: Vault4Data['shapeShiftTxList'];
    }
  >;

type LegacyTestMigrationState = {
  meta: { version: number };
  data: LegacyTestData;
};

const wallet1State = wallet1 as unknown as LegacyTestMigrationState;
const vault4State = vault4 as LegacyTestMigrationState;

const runMigration = (
  migration: LegacyMigration,
  state: MigrationState,
): Promise<LegacyTestMigrationState> =>
  migration.migrate(state) as Promise<LegacyTestMigrationState>;

function expectDefined<Value>(
  value: Value,
): asserts value is NonNullable<Value> {
  expect(value).toBeDefined();
}

let vault6: LegacyTestMigrationState;
let vault7: LegacyTestMigrationState;
let vault8: LegacyTestMigrationState;
let vault9: LegacyTestMigrationState; // vault10, vault11

const oldTestRpc = 'https://rawtestrpc.metamask.io/';
const newTestRpc = 'https://testrpc.metamask.io/';

describe('wallet1 is migrated successfully', () => {
  it('should convert providers', () => {
    wallet1State.data.config.provider = {
      type: 'etherscan',
      rpcTarget: null,
    };

    runMigration(migration2, wallet1State)
      .then((secondResult) => {
        const secondData = secondResult.data;
        expect(secondData.config.provider.type).toStrictEqual('rpc');
        expect(secondData.config.provider.rpcTarget).toStrictEqual(
          'https://rpc.metamask.io/',
        );
        secondResult.data.config.provider.rpcTarget = oldTestRpc;
        return runMigration(migration3, secondResult);
      })
      .then((thirdResult) => {
        expect(thirdResult.data.config.provider.rpcTarget).toStrictEqual(
          newTestRpc,
        );
        return runMigration(migration4, thirdResult);
      })
      .then((fourthResult) => {
        const fourthData = fourthResult.data;
        expect(fourthData.config.provider.rpcTarget).toBeUndefined();
        expect(fourthData.config.provider.type).toStrictEqual('testnet');

        return runMigration(migration5, vault4State);
      })
      .then((fifthResult) => {
        const fifthData = fifthResult.data;
        expect(fifthData.vault).toBeUndefined();
        expect(fifthData.walletNicknames).toBeUndefined();
        expect(fifthData.config.selectedAccount).toBeUndefined();
        expect(fifthData.KeyringController.vault).toStrictEqual(
          vault4State.data.vault,
        );
        expect(fifthData.KeyringController.selectedAccount).toStrictEqual(
          vault4State.data.config.selectedAccount,
        );
        const { walletNicknames } = fifthData.KeyringController;
        expectDefined(walletNicknames);
        expect(
          walletNicknames['0x0beb674745816b125fbc07285d39fd373e64895c'],
        ).toStrictEqual(
          vault4State.data.walletNicknames?.[
            '0x0beb674745816b125fbc07285d39fd373e64895c'
          ],
        );

        return runMigration(migration6, fifthResult);
      })
      .then((sixthResult) => {
        expect(
          sixthResult.data.KeyringController.selectedAccount,
        ).toBeUndefined();

        vault6 = sixthResult;
        return runMigration(migration7, sixthResult);
      })
      .then((seventhResult) => {
        expect(seventhResult.data.transactions).toBeUndefined();
        expect(seventhResult.data.gasMultiplier).toBeUndefined();
        const { transactions } = vault6.data;
        expectDefined(transactions);
        expect(
          seventhResult.data.TransactionManager.transactions[0].id,
        ).toStrictEqual(transactions[0].id);
        expect(
          seventhResult.data.TransactionManager.gasMultiplier,
        ).toStrictEqual(vault6.data.gasMultiplier);

        vault7 = seventhResult;
        return runMigration(migration8, seventhResult);
      })
      .then((eighthResult) => {
        expect(eighthResult.data.noticesList).toBeUndefined();
        const { noticesList } = vault7.data;
        expectDefined(noticesList);
        expect(
          eighthResult.data.NoticeController.noticesList[0].title,
        ).toStrictEqual(noticesList[0].title);

        vault8 = eighthResult;
        return runMigration(migration9, eighthResult);
      })
      .then((ninthResult) => {
        expect(ninthResult.data.currentFiat).toBeUndefined();
        expect(ninthResult.data.fiatCurrency).toBeUndefined();
        expect(ninthResult.data.conversionRate).toBeUndefined();
        expect(ninthResult.data.conversionDate).toBeUndefined();

        expect(
          ninthResult.data.CurrencyController.currentCurrency,
        ).toStrictEqual(vault8.data.fiatCurrency);
        expect(
          ninthResult.data.CurrencyController.conversionRate,
        ).toStrictEqual(vault8.data.conversionRate);
        expect(
          ninthResult.data.CurrencyController.conversionDate,
        ).toStrictEqual(vault8.data.conversionDate);

        vault9 = ninthResult;
        return runMigration(migration10, ninthResult);
      })
      .then((tenthResult) => {
        expect(tenthResult.data.shapeShiftTxList).toBeUndefined();
        const { shapeShiftTxList } = vault9.data;
        expectDefined(shapeShiftTxList);
        expect(
          tenthResult.data.ShapeShiftController.shapeShiftTxList[0],
        ).toStrictEqual(shapeShiftTxList[0]);

        return runMigration(migration11, tenthResult);
      })
      .then((eleventhResult) => {
        expect(eleventhResult.data.isDisclaimerConfirmed).toBeUndefined();
        expect(eleventhResult.data.TOSHash).toBeUndefined();

        return runMigration(migration12, eleventhResult);
      })
      .then((twelfthResult) => {
        expect(
          twelfthResult.data.NoticeController.noticesList[0].body,
        ).toStrictEqual('');
        expect(
          twelfthResult.data.NoticeController.noticesList[1].body,
        ).toStrictEqual('nonempty');

        expect(twelfthResult.data.config.provider.type).toStrictEqual(
          'testnet',
        );
        return runMigration(migration13, twelfthResult);
      });
  });
});
