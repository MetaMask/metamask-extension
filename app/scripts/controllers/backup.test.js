import { strict as assert } from 'assert';
import sinon from 'sinon';
import BackupController from './backup';

function getMockController() {
  const mcState = {
    getSelectedAddress: sinon.stub().returns('0x01'),
    selectedAddress: '0x01',
    identities: {
      '0x295e26495CEF6F69dFA69911d9D8e4F3bBadB89B': {
        address: '0x295e26495CEF6F69dFA69911d9D8e4F3bBadB89B',
        lastSelected: 1655380342907,
        name: 'Account 3',
      },
    },
    lostIdentities: {
      '0xfd59bbe569376e3d3e4430297c3c69ea93f77435': {
        address: '0xfd59bbe569376e3d3e4430297c3c69ea93f77435',
        lastSelected: 1655379648197,
        name: 'Ledger 1',
      },
    },
    update: (store) => (mcState.store = store),
  };

  mcState.store = {
    getState: sinon.stub().returns(mcState),
    updateState: (store) => (mcState.store = store),
  };

  return mcState;
}

const jsonData = `{"preferences":{"frequentRpcListDetail":[{"chainId":"0x539","nickname":"Localhost 8545","rpcPrefs":{},"rpcUrl":"http://localhost:8545","ticker":"ETH"},{"chainId":"0x38","nickname":"Binance Smart Chain Mainnet","rpcPrefs":{"blockExplorerUrl":"https://bscscan.com"},"rpcUrl":"https://bsc-dataseed1.binance.org","ticker":"BNB"},{"chainId":"0x61","nickname":"Binance Smart Chain Testnet","rpcPrefs":{"blockExplorerUrl":"https://testnet.bscscan.com"},"rpcUrl":"https://data-seed-prebsc-1-s1.binance.org:8545","ticker":"tBNB"},{"chainId":"0x89","nickname":"Polygon Mainnet","rpcPrefs":{"blockExplorerUrl":"https://polygonscan.com"},"rpcUrl":"https://polygon-rpc.com","ticker":"MATIC"}],"useBlockie":false,"useNonceField":false,"usePhishDetect":true,"dismissSeedBackUpReminder":false,"useTokenDetection":false,"useCollectibleDetection":false,"openSeaEnabled":false,"advancedGasFee":null,"featureFlags":{"sendHexData":true,"showIncomingTransactions":true},"knownMethodData":{},"currentLocale":"en","forgottenPassword":false,"preferences":{"hideZeroBalanceTokens":false,"showFiatInTestnets":false,"showTestNetworks":true,"useNativeCurrencyAsPrimaryCurrency":true},"ipfsGateway":"dweb.link","infuraBlocked":false,"ledgerTransportType":"webhid","theme":"light","customNetworkListEnabled":false,"textDirection":"auto"},"addressBook":{"addressBook":{"0x61":{"0x42EB768f2244C8811C63729A21A3569731535f06":{"address":"0x42EB768f2244C8811C63729A21A3569731535f06","chainId":"0x61","isEns":false,"memo":"","name":""}}}}}`;

describe('BackupController', function () {
  const getBackupController = () => {
    return new BackupController({
      preferencesController: getMockController(),
      addressBookController: getMockController(),
      trackMetaMetricsEvent: sinon.stub(),
    });
  };

  describe('constructor', function () {
    it('should setup correctly', async function () {
      const backupController = getBackupController();
      const selectedAddress =
        backupController.preferencesController.getSelectedAddress();
      assert.equal(selectedAddress, '0x01');
    });

    it('should restore backup', async function () {
      const backupController = getBackupController();
      backupController.restoreUserData(jsonData);
      // check Preferences backup
      assert.equal(
        backupController.preferencesController.store.frequentRpcListDetail[0]
          .chainId,
        '0x539',
      );
      assert.equal(
        backupController.preferencesController.store.frequentRpcListDetail[1]
          .chainId,
        '0x38',
      );
      // make sure identities are not lost after restore
      assert.equal(
        backupController.preferencesController.store.identities[
          '0x295e26495CEF6F69dFA69911d9D8e4F3bBadB89B'
        ].lastSelected,
        1655380342907,
      );
      assert.equal(
        backupController.preferencesController.store.identities[
          '0x295e26495CEF6F69dFA69911d9D8e4F3bBadB89B'
        ].name,
        'Account 3',
      );
      assert.equal(
        backupController.preferencesController.store.lostIdentities[
          '0xfd59bbe569376e3d3e4430297c3c69ea93f77435'
        ].lastSelected,
        1655379648197,
      );
      assert.equal(
        backupController.preferencesController.store.lostIdentities[
          '0xfd59bbe569376e3d3e4430297c3c69ea93f77435'
        ].name,
        'Ledger 1',
      );
      // make sure selected address is not lost after restore
      assert.equal(
        backupController.preferencesController.store.selectedAddress,
        '0x01',
      );
      // check address book backup
      assert.equal(
        backupController.addressBookController.store.addressBook['0x61'][
          '0x42EB768f2244C8811C63729A21A3569731535f06'
        ].chainId,
        '0x61',
      );
      assert.equal(
        backupController.addressBookController.store.addressBook['0x61'][
          '0x42EB768f2244C8811C63729A21A3569731535f06'
        ].address,
        '0x42EB768f2244C8811C63729A21A3569731535f06',
      );
      assert.equal(
        backupController.addressBookController.store.addressBook['0x61'][
          '0x42EB768f2244C8811C63729A21A3569731535f06'
        ].isEns,
        false,
      );
    });
  });
});
