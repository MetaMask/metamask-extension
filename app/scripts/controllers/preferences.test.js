import { strict as assert } from 'assert';
import sinon from 'sinon';
import { ControllerMessenger } from '@metamask/base-controller';
import { TokenListController } from '@metamask/assets-controllers';
import { CHAIN_IDS } from '../../../shared/constants/network';
import PreferencesController from './preferences';
import NetworkController from './network';

describe('preferences controller', function () {
  let preferencesController;
  let network;
  let currentChainId;
  let provider;
  let tokenListController;

  beforeEach(function () {
    const sandbox = sinon.createSandbox();
    currentChainId = CHAIN_IDS.MAINNET;
    const networkControllerProviderConfig = {
      getAccounts: () => undefined,
    };
    network = new NetworkController({ infuraProjectId: 'foo' });
    network.initializeProvider(networkControllerProviderConfig);
    provider = network.getProviderAndBlockTracker().provider;
    const tokenListMessenger = new ControllerMessenger().getRestricted({
      name: 'TokenListController',
    });
    tokenListController = new TokenListController({
      chainId: '1',
      preventPollingOnNetworkRestart: false,
      onNetworkStateChange: sinon.spy(),
      onPreferencesStateChange: sinon.spy(),
      messenger: tokenListMessenger,
    });

    sandbox
      .stub(network, '_getLatestBlock')
      .callsFake(() => Promise.resolve({}));
    sandbox.stub(network, 'getCurrentChainId').callsFake(() => currentChainId);
    sandbox
      .stub(network, 'getProviderConfig')
      .callsFake(() => ({ type: 'mainnet' }));

    preferencesController = new PreferencesController({
      initLangCode: 'en_US',
      network,
      provider,
      tokenListController,
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('useBlockie', function () {
    it('defaults useBlockie to false', function () {
      assert.equal(preferencesController.store.getState().useBlockie, false);
    });

    it('setUseBlockie to true', function () {
      preferencesController.setUseBlockie(true);
      assert.equal(preferencesController.store.getState().useBlockie, true);
    });
  });

  describe('setCurrentLocale', function () {
    it('checks the default currentLocale', function () {
      const { currentLocale } = preferencesController.store.getState();
      assert.equal(currentLocale, 'en_US');
    });

    it('sets current locale in preferences controller', function () {
      preferencesController.setCurrentLocale('ja');
      const { currentLocale } = preferencesController.store.getState();
      assert.equal(currentLocale, 'ja');
    });
  });

  describe('setAddresses', function () {
    it('should keep a map of addresses to names and addresses in the store', function () {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);

      const { identities } = preferencesController.store.getState();
      assert.deepEqual(identities, {
        '0xda22le': {
          name: 'Account 1',
          address: '0xda22le',
        },
        '0x7e57e2': {
          name: 'Account 2',
          address: '0x7e57e2',
        },
      });
    });

    it('should replace its list of addresses', function () {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);
      preferencesController.setAddresses(['0xda22le77', '0x7e57e277']);

      const { identities } = preferencesController.store.getState();
      assert.deepEqual(identities, {
        '0xda22le77': {
          name: 'Account 1',
          address: '0xda22le77',
        },
        '0x7e57e277': {
          name: 'Account 2',
          address: '0x7e57e277',
        },
      });
    });
  });

  describe('removeAddress', function () {
    it('should remove an address from state', function () {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);

      preferencesController.removeAddress('0xda22le');

      assert.equal(
        preferencesController.store.getState().identities['0xda22le'],
        undefined,
      );
    });

    it('should switch accounts if the selected address is removed', function () {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);

      preferencesController.setSelectedAddress('0x7e57e2');
      preferencesController.removeAddress('0x7e57e2');

      assert.equal(preferencesController.getSelectedAddress(), '0xda22le');
    });
  });

  describe('setAccountLabel', function () {
    it('should update a label for the given account', function () {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);

      assert.deepEqual(
        preferencesController.store.getState().identities['0xda22le'],
        {
          name: 'Account 1',
          address: '0xda22le',
        },
      );

      preferencesController.setAccountLabel('0xda22le', 'Dazzle');
      assert.deepEqual(
        preferencesController.store.getState().identities['0xda22le'],
        {
          name: 'Dazzle',
          address: '0xda22le',
        },
      );
    });
  });

  describe('setPasswordForgotten', function () {
    it('should default to false', function () {
      const state = preferencesController.store.getState();
      assert.equal(state.forgottenPassword, false);
    });

    it('should set the forgottenPassword property in state', function () {
      assert.equal(
        preferencesController.store.getState().forgottenPassword,
        false,
      );

      preferencesController.setPasswordForgotten(true);

      assert.equal(
        preferencesController.store.getState().forgottenPassword,
        true,
      );
    });
  });

  describe('adding and removing from frequentRpcListDetail', function () {
    it('should add custom RPC url to state', function () {
      preferencesController.upsertToFrequentRpcList('rpc_url', '0x1');
      assert.deepEqual(
        preferencesController.store.getState().frequentRpcListDetail,
        [
          {
            rpcUrl: 'rpc_url',
            chainId: '0x1',
            ticker: 'ETH',
            nickname: '',
            rpcPrefs: {},
          },
        ],
      );
      preferencesController.upsertToFrequentRpcList('rpc_url', '0x1');
      assert.deepEqual(
        preferencesController.store.getState().frequentRpcListDetail,
        [
          {
            rpcUrl: 'rpc_url',
            chainId: '0x1',
            ticker: 'ETH',
            nickname: '',
            rpcPrefs: {},
          },
        ],
      );
    });

    it('should throw if chainId is invalid', function () {
      assert.throws(() => {
        preferencesController.upsertToFrequentRpcList('rpc_url', '1');
      }, 'should throw on invalid chainId');
    });

    it('should remove custom RPC url from state', function () {
      preferencesController.upsertToFrequentRpcList('rpc_url', '0x1');
      assert.deepEqual(
        preferencesController.store.getState().frequentRpcListDetail,
        [
          {
            rpcUrl: 'rpc_url',
            chainId: '0x1',
            ticker: 'ETH',
            nickname: '',
            rpcPrefs: {},
          },
        ],
      );
      preferencesController.removeFromFrequentRpcList('other_rpc_url');
      preferencesController.removeFromFrequentRpcList('http://localhost:8545');
      preferencesController.removeFromFrequentRpcList('rpc_url');
      assert.deepEqual(
        preferencesController.store.getState().frequentRpcListDetail,
        [],
      );
    });
  });

  describe('setUsePhishDetect', function () {
    it('should default to true', function () {
      const state = preferencesController.store.getState();
      assert.equal(state.usePhishDetect, true);
    });

    it('should set the usePhishDetect property in state', function () {
      assert.equal(preferencesController.store.getState().usePhishDetect, true);
      preferencesController.setUsePhishDetect(false);
      assert.equal(
        preferencesController.store.getState().usePhishDetect,
        false,
      );
    });
  });

  describe('setUseMultiAccountBalanceChecker', function () {
    it('should default to true', function () {
      const state = preferencesController.store.getState();
      assert.equal(state.useMultiAccountBalanceChecker, true);
    });

    it('should set the setUseMultiAccountBalanceChecker property in state', function () {
      assert.equal(
        preferencesController.store.getState().useMultiAccountBalanceChecker,
        true,
      );

      preferencesController.setUseMultiAccountBalanceChecker(false);

      assert.equal(
        preferencesController.store.getState().useMultiAccountBalanceChecker,
        false,
      );
    });
  });

  describe('setUseTokenDetection', function () {
    it('should default to false', function () {
      const state = preferencesController.store.getState();
      assert.equal(state.useTokenDetection, false);
    });

    it('should set the useTokenDetection property in state', function () {
      assert.equal(
        preferencesController.store.getState().useTokenDetection,
        false,
      );
      preferencesController.setUseTokenDetection(true);
      assert.equal(
        preferencesController.store.getState().useTokenDetection,
        true,
      );
    });
  });

  describe('setUseNftDetection', function () {
    it('should default to false', function () {
      const state = preferencesController.store.getState();
      assert.equal(state.useNftDetection, false);
    });

    it('should set the useNftDetection property in state', function () {
      assert.equal(
        preferencesController.store.getState().useNftDetection,
        false,
      );
      preferencesController.setOpenSeaEnabled(true);
      preferencesController.setUseNftDetection(true);
      assert.equal(
        preferencesController.store.getState().useNftDetection,
        true,
      );
    });
  });

  describe('setOpenSeaEnabled', function () {
    it('should default to false', function () {
      const state = preferencesController.store.getState();
      assert.equal(state.openSeaEnabled, false);
    });

    it('should set the openSeaEnabled property in state', function () {
      assert.equal(
        preferencesController.store.getState().openSeaEnabled,
        false,
      );
      preferencesController.setOpenSeaEnabled(true);
      assert.equal(preferencesController.store.getState().openSeaEnabled, true);
    });
  });

  describe('setAdvancedGasFee', function () {
    it('should default to null', function () {
      const state = preferencesController.store.getState();
      assert.equal(state.advancedGasFee, null);
    });

    it('should set the setAdvancedGasFee property in state', function () {
      const state = preferencesController.store.getState();
      assert.equal(state.advancedGasFee, null);
      preferencesController.setAdvancedGasFee({
        maxBaseFee: '1.5',
        priorityFee: '2',
      });
      assert.equal(
        preferencesController.store.getState().advancedGasFee.maxBaseFee,
        '1.5',
      );
      assert.equal(
        preferencesController.store.getState().advancedGasFee.priorityFee,
        '2',
      );
    });
  });

  describe('setTheme', function () {
    it('should default to value "OS"', function () {
      const state = preferencesController.store.getState();
      assert.equal(state.theme, 'os');
    });

    it('should set the setTheme property in state', function () {
      const state = preferencesController.store.getState();
      assert.equal(state.theme, 'os');
      preferencesController.setTheme('dark');
      assert.equal(preferencesController.store.getState().theme, 'dark');
    });
  });

  describe('setUseCurrencyRateCheck', function () {
    it('should default to false', function () {
      const state = preferencesController.store.getState();
      assert.equal(state.useCurrencyRateCheck, true);
    });

    it('should set the useCurrencyRateCheck property in state', function () {
      assert.equal(
        preferencesController.store.getState().useCurrencyRateCheck,
        true,
      );
      preferencesController.setUseCurrencyRateCheck(false);
      assert.equal(
        preferencesController.store.getState().useCurrencyRateCheck,
        false,
      );
    });
  });
});
