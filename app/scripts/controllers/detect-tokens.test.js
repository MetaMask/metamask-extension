import { strict as assert } from 'assert';
import sinon from 'sinon';
import nock from 'nock';
import { ObservableStore } from '@metamask/obs-store';
import BigNumber from 'bignumber.js';
import { ControllerMessenger } from '@metamask/base-controller';
import {
  TokenListController,
  TokensController,
  AssetsContractController,
} from '@metamask/assets-controllers';
import { toHex } from '@metamask/controller-utils';
import { NetworkController } from '@metamask/network-controller';
import { NETWORK_TYPES } from '../../../shared/constants/network';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import DetectTokensController from './detect-tokens';
import PreferencesController from './preferences';

function buildMessenger() {
  return new ControllerMessenger().getRestricted({
    name: 'DetectTokensController',
    allowedEvents: ['NetworkController:stateChange'],
  });
}

describe('DetectTokensController', function () {
  let sandbox,
    assetsContractController,
    keyringMemStore,
    network,
    preferences,
    provider,
    tokensController,
    tokenListController;

  const noop = () => undefined;

  const networkControllerProviderConfig = {
    getAccounts: noop,
  };

  const infuraProjectId = 'infura-project-id';

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
    // Disable all requests, even those to localhost
    nock.disableNetConnect();
    nock('https://mainnet.infura.io')
      .post(`/v3/${infuraProjectId}`)
      .reply(200, (_uri, requestBody) => {
        if (requestBody.method === 'eth_getBlockByNumber') {
          return {
            id: requestBody.id,
            jsonrpc: '2.0',
            result: {
              number: '0x42',
            },
          };
        }

        if (requestBody.method === 'eth_blockNumber') {
          return {
            id: requestBody.id,
            jsonrpc: '2.0',
            result: '0x42',
          };
        }

        throw new Error(`(Infura) Mock not defined for ${requestBody.method}`);
      })
      .persist();
    nock('https://sepolia.infura.io')
      .post(`/v3/${infuraProjectId}`)
      .reply(200, (_uri, requestBody) => {
        if (requestBody.method === 'eth_getBlockByNumber') {
          return {
            id: requestBody.id,
            jsonrpc: '2.0',
            result: {
              number: '0x42',
            },
          };
        }

        if (requestBody.method === 'eth_blockNumber') {
          return {
            id: requestBody.id,
            jsonrpc: '2.0',
            result: '0x42',
          };
        }

        throw new Error(`(Infura) Mock not defined for ${requestBody.method}`);
      })
      .persist();
    nock('http://localhost:8545')
      .post('/')
      .reply(200, (_uri, requestBody) => {
        if (requestBody.method === 'eth_getBlockByNumber') {
          return {
            id: requestBody.id,
            jsonrpc: '2.0',
            result: {
              number: '0x42',
            },
          };
        }

        if (requestBody.method === 'eth_blockNumber') {
          return {
            id: requestBody.id,
            jsonrpc: '2.0',
            result: '0x42',
          };
        }

        if (requestBody.method === 'net_version') {
          return {
            id: requestBody.id,
            jsonrpc: '2.0',
            result: '1337',
          };
        }

        throw new Error(
          `(localhost) Mock not defined for ${requestBody.method}`,
        );
      })
      .persist();
    nock('https://token-api.metaswap.codefi.network')
      .get(`/tokens/1`)
      .reply(200, [
        {
          address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
          symbol: 'SNX',
          decimals: 18,
          occurrences: 11,
          aggregators: [
            'paraswap',
            'pmm',
            'airswapLight',
            'zeroEx',
            'bancor',
            'coinGecko',
            'zapper',
            'kleros',
            'zerion',
            'cmc',
            'oneInch',
          ],
          name: 'Synthetix',
          iconUrl: 'https://airswap-token-images.s3.amazonaws.com/SNX.png',
        },
        {
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 18,
          occurrences: 11,
          aggregators: [
            'paraswap',
            'pmm',
            'airswapLight',
            'zeroEx',
            'bancor',
            'coinGecko',
            'zapper',
            'kleros',
            'zerion',
            'cmc',
            'oneInch',
          ],
          name: 'Chainlink',
          iconUrl: 'https://s3.amazonaws.com/airswap-token-images/LINK.png',
        },
        {
          address: '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c',
          symbol: 'BNT',
          decimals: 18,
          occurrences: 11,
          aggregators: [
            'paraswap',
            'pmm',
            'airswapLight',
            'zeroEx',
            'bancor',
            'coinGecko',
            'zapper',
            'kleros',
            'zerion',
            'cmc',
            'oneInch',
          ],
          name: 'Bancor',
          iconUrl: 'https://s3.amazonaws.com/airswap-token-images/BNT.png',
        },
      ])
      .get(`/tokens/3`)
      .reply(200, { error: 'ChainId 3 is not supported' })
      .persist();

    keyringMemStore = new ObservableStore({ isUnlocked: false });
    const networkControllerMessenger = new ControllerMessenger();
    network = new NetworkController({
      messenger: networkControllerMessenger,
      infuraProjectId,
    });
    await network.initializeProvider(networkControllerProviderConfig);
    provider = network.getProviderAndBlockTracker().provider;

    const tokenListMessenger = new ControllerMessenger().getRestricted({
      name: 'TokenListController',
    });
    tokenListController = new TokenListController({
      chainId: toHex(1),
      preventPollingOnNetworkRestart: false,
      onNetworkStateChange: sinon.spy(),
      onPreferencesStateChange: sinon.spy(),
      messenger: tokenListMessenger,
    });
    await tokenListController.start();

    preferences = new PreferencesController({
      network,
      provider,
      tokenListController,
      onInfuraIsBlocked: sinon.stub(),
      onInfuraIsUnblocked: sinon.stub(),
      networkConfigurations: {},
    });
    preferences.setAddresses([
      '0x7e57e2',
      '0xbc86727e770de68b1060c91f6bb6945c73e10388',
    ]);
    preferences.setUseTokenDetection(true);

    tokensController = new TokensController({
      config: { provider },
      onPreferencesStateChange: preferences.store.subscribe.bind(
        preferences.store,
      ),
      onNetworkStateChange: networkControllerMessenger.subscribe.bind(
        networkControllerMessenger,
        'NetworkController:stateChange',
      ),
    });

    assetsContractController = new AssetsContractController({
      onPreferencesStateChange: preferences.store.subscribe.bind(
        preferences.store,
      ),
      onNetworkStateChange: networkControllerMessenger.subscribe.bind(
        networkControllerMessenger,
        'NetworkController:stateChange',
      ),
    });
  });

  afterEach(function () {
    nock.enableNetConnect('localhost');
    sandbox.restore();
  });

  it('should poll on correct interval', async function () {
    const stub = sinon.stub(global, 'setInterval');
    new DetectTokensController({ messenger: buildMessenger(), interval: 1337 }); // eslint-disable-line no-new
    assert.strictEqual(stub.getCall(0).args[1], 1337);
    stub.restore();
  });

  it('should be called on every polling period', async function () {
    const clock = sandbox.useFakeTimers();
    await network.setProviderType(NETWORK_TYPES.MAINNET);
    const controller = new DetectTokensController({
      messenger: buildMessenger(),
      preferences,
      network,
      keyringMemStore,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;

    const stub = sandbox.stub(controller, 'detectNewTokens');

    clock.tick(1);
    sandbox.assert.notCalled(stub);
    clock.tick(180000);
    sandbox.assert.called(stub);
    clock.tick(180000);
    sandbox.assert.calledTwice(stub);
    clock.tick(180000);
    sandbox.assert.calledThrice(stub);
  });

  it('should not check and add tokens while on unsupported networks', async function () {
    sandbox.useFakeTimers();
    await network.setProviderType(NETWORK_TYPES.SEPOLIA);
    const tokenListMessengerSepolia = new ControllerMessenger().getRestricted({
      name: 'TokenListController',
    });
    tokenListController = new TokenListController({
      chainId: toHex(11155111),
      onNetworkStateChange: sinon.spy(),
      onPreferencesStateChange: sinon.spy(),
      messenger: tokenListMessengerSepolia,
    });
    await tokenListController.start();
    const controller = new DetectTokensController({
      messenger: buildMessenger(),
      preferences,
      network,
      keyringMemStore,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;

    const stub = sandbox.stub(
      assetsContractController,
      'getBalancesInSingleCall',
    );

    await controller.detectNewTokens();
    sandbox.assert.notCalled(stub);
  });

  it('should skip adding tokens listed in ignoredTokens array', async function () {
    sandbox.useFakeTimers();
    await network.setProviderType(NETWORK_TYPES.MAINNET);
    const controller = new DetectTokensController({
      messenger: buildMessenger(),
      preferences,
      network,
      keyringMemStore,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
      trackMetaMetricsEvent: noop,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;

    const { tokenList } = tokenListController.state;
    const tokenValues = Object.values(tokenList);

    await tokensController.addDetectedTokens([
      {
        address: tokenValues[0].address,
        symbol: tokenValues[0].symbol,
        decimals: tokenValues[0].decimals,
        aggregators: undefined,
        image: undefined,
        isERC721: undefined,
      },
    ]);

    sandbox
      .stub(assetsContractController, 'getBalancesInSingleCall')
      .callsFake((tokensToDetect) =>
        tokensToDetect.map((token) =>
          token.address === tokenValues[1].address ? new BigNumber(10) : 0,
        ),
      );
    await tokensController.ignoreTokens([tokenValues[1].address]);

    await controller.detectNewTokens();
    assert.deepEqual(tokensController.state.detectedTokens, [
      {
        address: toChecksumHexAddress(tokenValues[0].address),
        decimals: tokenValues[0].decimals,
        symbol: tokenValues[0].symbol,
        aggregators: undefined,
        image: undefined,
        isERC721: undefined,
      },
    ]);
  });

  it('should check and add tokens while on supported networks', async function () {
    sandbox.useFakeTimers();
    await network.setProviderType(NETWORK_TYPES.MAINNET);
    const controller = new DetectTokensController({
      messenger: buildMessenger(),
      preferences,
      network,
      keyringMemStore,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
      trackMetaMetricsEvent: noop,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;

    const { tokenList } = tokenListController.state;
    const erc20ContractAddresses = Object.keys(tokenList);

    const existingTokenAddress = erc20ContractAddresses[0];
    const existingToken = tokenList[existingTokenAddress];

    await tokensController.addDetectedTokens([
      {
        address: existingToken.address,
        symbol: existingToken.symbol,
        decimals: existingToken.decimals,
        aggregators: undefined,
        image: undefined,
        isERC721: undefined,
      },
    ]);
    const tokenAddressToAdd = erc20ContractAddresses[1];
    const tokenToAdd = tokenList[tokenAddressToAdd];
    sandbox
      .stub(assetsContractController, 'getBalancesInSingleCall')
      .callsFake(() =>
        Promise.resolve({ [tokenAddressToAdd]: new BigNumber(10) }),
      );
    await controller.detectNewTokens();
    assert.deepEqual(tokensController.state.detectedTokens, [
      {
        address: toChecksumHexAddress(existingTokenAddress),
        decimals: existingToken.decimals,
        symbol: existingToken.symbol,
        aggregators: undefined,
        image: undefined,
        isERC721: undefined,
      },
      {
        address: toChecksumHexAddress(tokenAddressToAdd),
        decimals: tokenToAdd.decimals,
        symbol: tokenToAdd.symbol,
        aggregators: undefined,
        image: undefined,
        isERC721: undefined,
      },
    ]);
  });

  it('should trigger detect new tokens when change address', async function () {
    sandbox.useFakeTimers();
    const controller = new DetectTokensController({
      messenger: buildMessenger(),
      preferences,
      network,
      keyringMemStore,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;
    const stub = sandbox.stub(controller, 'detectNewTokens');
    await preferences.setSelectedAddress(
      '0xbc86727e770de68b1060c91f6bb6945c73e10388',
    );
    sandbox.assert.called(stub);
  });

  it('should trigger detect new tokens when submit password', async function () {
    sandbox.useFakeTimers();
    const controller = new DetectTokensController({
      messenger: buildMessenger(),
      preferences,
      network,
      keyringMemStore,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
    });
    controller.isOpen = true;
    controller.selectedAddress = '0x0';
    const stub = sandbox.stub(controller, 'detectNewTokens');
    await controller._keyringMemStore.updateState({ isUnlocked: true });
    sandbox.assert.called(stub);
  });

  it('should not trigger detect new tokens when not unlocked', async function () {
    const clock = sandbox.useFakeTimers();
    await network.setProviderType(NETWORK_TYPES.MAINNET);
    const controller = new DetectTokensController({
      messenger: buildMessenger(),
      preferences,
      network,
      keyringMemStore,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
    });
    controller.isOpen = true;
    controller.isUnlocked = false;
    const stub = sandbox.stub(
      assetsContractController,
      'getBalancesInSingleCall',
    );
    clock.tick(180000);
    sandbox.assert.notCalled(stub);
  });

  it('should not trigger detect new tokens when not open', async function () {
    const clock = sandbox.useFakeTimers();
    await network.setProviderType(NETWORK_TYPES.MAINNET);
    const controller = new DetectTokensController({
      messenger: buildMessenger(),
      preferences,
      network,
      keyringMemStore,
      tokensController,
      assetsContractController,
    });
    // trigger state update from preferences controller
    await preferences.setSelectedAddress(
      '0xbc86727e770de68b1060c91f6bb6945c73e10388',
    );
    controller.isOpen = false;
    controller.isUnlocked = true;
    const stub = sandbox.stub(
      assetsContractController,
      'getBalancesInSingleCall',
    );
    clock.tick(180000);
    sandbox.assert.notCalled(stub);
  });
});
