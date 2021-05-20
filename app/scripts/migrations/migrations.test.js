import { strict as assert } from 'assert';
import wallet1 from '../../../test/lib/migrations/001.json';
import vault4 from '../../../test/lib/migrations/004.json';
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

let vault5, vault6, vault7, vault8, vault9; // vault10, vault11

const oldTestRpc = 'https://rawtestrpc.metamask.io/';
const newTestRpc = 'https://testrpc.metamask.io/';

describe('wallet1 is migrated successfully', function () {
  it('should convert providers', function () {
    wallet1.data.config.provider = { type: 'etherscan', rpcTarget: null };

    return migration2
      .migrate(wallet1)
      .then((secondResult) => {
        const secondData = secondResult.data;
        assert.equal(
          secondData.config.provider.type,
          'rpc',
          'provider should be rpc',
        );
        assert.equal(
          secondData.config.provider.rpcTarget,
          'https://rpc.metamask.io/',
          'main provider should be our rpc',
        );
        secondResult.data.config.provider.rpcTarget = oldTestRpc;
        return migration3.migrate(secondResult);
      })
      .then((thirdResult) => {
        assert.equal(
          thirdResult.data.config.provider.rpcTarget,
          newTestRpc,
          'config.provider.rpcTarget should be set to the proper testrpc url.',
        );
        return migration4.migrate(thirdResult);
      })
      .then((fourthResult) => {
        const fourthData = fourthResult.data;
        assert.equal(
          fourthData.config.provider.rpcTarget,
          undefined,
          'old rpcTarget should not exist.',
        );
        assert.equal(
          fourthData.config.provider.type,
          'testnet',
          'config.provider should be set to testnet.',
        );

        return migration5.migrate(vault4);
      })
      .then((fifthResult) => {
        const fifthData = fifthResult.data;
        assert.equal(fifthData.vault, undefined, 'old vault should not exist');
        assert.equal(
          fifthData.walletNicknames,
          undefined,
          'old walletNicknames should not exist',
        );
        assert.equal(
          fifthData.config.selectedAccount,
          undefined,
          'old config.selectedAccount should not exist',
        );
        assert.equal(
          fifthData.KeyringController.vault,
          vault4.data.vault,
          'KeyringController.vault should exist',
        );
        assert.equal(
          fifthData.KeyringController.selectedAccount,
          vault4.data.config.selectedAccount,
          'KeyringController.selectedAccount should have moved',
        );
        assert.equal(
          fifthData.KeyringController.walletNicknames[
            '0x0beb674745816b125fbc07285d39fd373e64895c'
          ],
          vault4.data.walletNicknames[
            '0x0beb674745816b125fbc07285d39fd373e64895c'
          ],
          'KeyringController.walletNicknames should have moved',
        );

        vault5 = fifthResult;
        return migration6.migrate(fifthResult);
      })
      .then((sixthResult) => {
        assert.equal(
          sixthResult.data.KeyringController.selectedAccount,
          undefined,
          'old selectedAccount should not exist',
        );
        assert.equal(
          sixthResult.data.PreferencesController.selectedAddress,
          vault5.data.KeyringController.selectedAccount,
          'selectedAccount should have moved',
        );

        vault6 = sixthResult;
        return migration7.migrate(sixthResult);
      })
      .then((seventhResult) => {
        assert.equal(
          seventhResult.data.transactions,
          undefined,
          'old transactions should not exist',
        );
        assert.equal(
          seventhResult.data.gasMultiplier,
          undefined,
          'old gasMultiplier should not exist',
        );
        assert.equal(
          seventhResult.data.TransactionManager.transactions[0].id,
          vault6.data.transactions[0].id,
          'transactions should have moved',
        );
        assert.equal(
          seventhResult.data.TransactionManager.gasMultiplier,
          vault6.data.gasMultiplier,
          'gasMultiplier should have moved',
        );

        vault7 = seventhResult;
        return migration8.migrate(seventhResult);
      })
      .then((eighthResult) => {
        assert.equal(
          eighthResult.data.noticesList,
          undefined,
          'old noticesList should not exist',
        );
        assert.equal(
          eighthResult.data.NoticeController.noticesList[0].title,
          vault7.data.noticesList[0].title,
          'noticesList should have moved',
        );

        vault8 = eighthResult;
        return migration9.migrate(eighthResult);
      })
      .then((ninthResult) => {
        assert.equal(
          ninthResult.data.currentFiat,
          undefined,
          'old currentFiat should not exist',
        );
        assert.equal(
          ninthResult.data.fiatCurrency,
          undefined,
          'old fiatCurrency should not exist',
        );
        assert.equal(
          ninthResult.data.conversionRate,
          undefined,
          'old conversionRate should not exist',
        );
        assert.equal(
          ninthResult.data.conversionDate,
          undefined,
          'old conversionDate should not exist',
        );

        assert.equal(
          ninthResult.data.CurrencyController.currentCurrency,
          vault8.data.fiatCurrency,
          'currentFiat should have moved',
        );
        assert.equal(
          ninthResult.data.CurrencyController.conversionRate,
          vault8.data.conversionRate,
          'conversionRate should have moved',
        );
        assert.equal(
          ninthResult.data.CurrencyController.conversionDate,
          vault8.data.conversionDate,
          'conversionDate should have moved',
        );

        vault9 = ninthResult;
        return migration10.migrate(ninthResult);
      })
      .then((tenthResult) => {
        assert.equal(
          tenthResult.data.shapeShiftTxList,
          undefined,
          'old shapeShiftTxList should not exist',
        );
        assert.equal(
          tenthResult.data.ShapeShiftController.shapeShiftTxList[0].transaction,
          vault9.data.shapeShiftTxList[0].transaction,
        );

        return migration11.migrate(tenthResult);
      })
      .then((eleventhResult) => {
        assert.equal(
          eleventhResult.data.isDisclaimerConfirmed,
          undefined,
          'isDisclaimerConfirmed should not exist',
        );
        assert.equal(
          eleventhResult.data.TOSHash,
          undefined,
          'TOSHash should not exist',
        );

        return migration12.migrate(eleventhResult);
      })
      .then((twelfthResult) => {
        assert.equal(
          twelfthResult.data.NoticeController.noticesList[0].body,
          '',
          'notices that have been read should have an empty body.',
        );
        assert.equal(
          twelfthResult.data.NoticeController.noticesList[1].body,
          'nonempty',
          'notices that have not been read should not have an empty body.',
        );

        assert.equal(
          twelfthResult.data.config.provider.type,
          'testnet',
          'network is originally testnet.',
        );
        return migration13.migrate(twelfthResult);
      })
      .then((thirteenthResult) => {
        assert.equal(
          thirteenthResult.data.config.provider.type,
          'ropsten',
          'network has been changed to ropsten.',
        );
      });
  });
});
