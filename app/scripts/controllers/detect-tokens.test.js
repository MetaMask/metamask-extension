/**
 * @jest-environment node
 */
import { strict as assert } from 'assert';
import sinon from 'sinon';
import nock from 'nock';
import BigNumber from 'bignumber.js';
import { ControllerMessenger } from '@metamask/base-controller';
import {
  TokenListController,
  TokensController,
  AssetsContractController,
} from '@metamask/assets-controllers';
import { toHex } from '@metamask/controller-utils';
import { EthMethod, EthAccountType } from '@metamask/keyring-api';
import { NetworkController } from '@metamask/network-controller';
import { AccountsController } from '@metamask/accounts-controller';
import { NETWORK_TYPES } from '../../../shared/constants/network';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import DetectTokensController from './detect-tokens';
import PreferencesController from './preferences';

const flushPromises = () => {
  return new Promise(jest.requireActual('timers').setImmediate);
};

describe('DetectTokensController', function () {
  let sandbox,
    interval,
    assetsContractController,
    network,
    preferences,
    provider,
    tokensController,
    tokenListController,
    accountsController,
    preferencesControllerMessenger,
    getCurrentSelectedAccount,
    getNetworkClientById,
    messenger;

  const noop = () => undefined;

  const getRestrictedMessenger = () => {
    return messenger.getRestricted({
      name: 'DetectTokensController',
      allowedActions: ['KeyringController:getState'],
      allowedEvents: [
        'NetworkController:stateChange',
        'KeyringController:lock',
        'KeyringController:unlock',
        'AccountsController:selectedAccountChange',
        'TokenListController:stateChange',
      ],
    });
  };

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

    jest.spyOn(ControllerMessenger.prototype, 'subscribe');

    messenger = new ControllerMessenger();
    messenger.registerActionHandler('KeyringController:getState', () => ({
      isUnlocked: true,
    }));

    const networkControllerMessenger = new ControllerMessenger();
    network = new NetworkController({
      messenger: networkControllerMessenger,
      infuraProjectId,
    });
    await network.initializeProvider(networkControllerProviderConfig);
    provider = network.getProviderAndBlockTracker().provider;

    const tokenListMessenger = new ControllerMessenger().getRestricted({
      name: 'TokenListController',
      allowedEvents: ['TokenListController:stateChange'],
    });
    tokenListController = new TokenListController({
      chainId: toHex(1),
      preventPollingOnNetworkRestart: false,
      onNetworkStateChange: sinon.spy(),
      onPreferencesStateChange: sinon.spy(),
      messenger: tokenListMessenger,
    });
    await tokenListController.start();

    preferencesControllerMessenger = new ControllerMessenger().getRestricted({
      name: 'PreferencesController',
      allowedEvents: ['AccountsController:selectedAccountChange'],
    });

    preferences = new PreferencesController({
      network,
      provider,
      tokenListController,
      networkConfigurations: {},
      onAccountRemoved: sinon.stub(),
      controllerMessenger: preferencesControllerMessenger,
    });
    preferences.setUseTokenDetection(true);

    const accountsControllerMessenger = new ControllerMessenger().getRestricted(
      {
        name: 'AccountsController',
        allowedEvents: [
          'SnapController:stateChange',
          'KeyringController:accountRemoved',
          'KeyringController:stateChange',
          'AccountsController:selectedAccountChange',
        ],
      },
    );

    accountsController = new AccountsController({
      messenger: accountsControllerMessenger,
      state: {
        internalAccounts: {
          accounts: {
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
              address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
              id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              metadata: {
                name: 'Account 1',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: [...Object.values(EthMethod)],
              type: EthAccountType.Eoa,
            },
            '07c2cfec-36c9-46c4-8115-3836d3ac9047': {
              address: '0xbc86727e770de68b1060c91f6bb6945c73e10388',
              id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
              metadata: {
                name: 'Account 2',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: [...Object.values(EthMethod)],
              type: EthAccountType.Eoa,
            },
          },
          selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        },
      },
      onSnapStateChange: sinon.spy(),
      onKeyringStateChange: sinon.spy(),
    });

    tokensController = new TokensController({
      config: {
        provider,
        selectedAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      },
      onPreferencesStateChange: (listener) =>
        accountsControllerMessenger.subscribe(
          `AccountsController:selectedAccountChange`,
          (newlySelectedInternalAccount) => {
            listener({ selectedAddress: newlySelectedInternalAccount.address });
          },
        ),
      onNetworkStateChange: networkControllerMessenger.subscribe.bind(
        networkControllerMessenger,
        'NetworkController:stateChange',
      ),
      onTokenListStateChange: (listener) =>
        tokenListMessenger.subscribe(
          `${tokenListController.name}:stateChange`,
          listener,
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

    getCurrentSelectedAccount = jest.fn().mockReturnValue({
      address: '0xbc86727e770de68b1060c91f6bb6945c73e10388',
    });

    getNetworkClientById = jest.fn();
  });

  afterEach(function () {
    nock.enableNetConnect('localhost');
    sandbox.restore();
  });

  it('should poll on correct interval', async function () {
    const stub = sinon.stub(global, 'setInterval');
    // eslint-disable-next-line no-new
    new DetectTokensController({
      messenger: getRestrictedMessenger(),
      interval: 1337,
      getCurrentSelectedAccount:
        accountsController.getSelectedAccount.bind(accountsController),
    });
    assert.strictEqual(stub.getCall(0).args[1], 1337);
    stub.restore();
  });

  it('should be called on every polling period', async function () {
    const clock = sandbox.useFakeTimers();
    await network.setProviderType(NETWORK_TYPES.MAINNET);
    const controller = new DetectTokensController({
      messenger: getRestrictedMessenger(),
      preferences,
      network,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
      getCurrentSelectedAccount:
        accountsController.getSelectedAccount.bind(accountsController),
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
      messenger: getRestrictedMessenger(),
      preferences,
      network,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
      getCurrentSelectedAccount:
        accountsController.getSelectedAccount.bind(accountsController),
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
      messenger: getRestrictedMessenger(),
      preferences,
      network,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
      trackMetaMetricsEvent: noop,
      getCurrentSelectedAccount:
        accountsController.getSelectedAccount.bind(accountsController),
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
        name: undefined,
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
        name: undefined,
      },
    ]);
  });

  it('should check and add tokens while on supported networks', async function () {
    sandbox.useFakeTimers();
    await network.setProviderType(NETWORK_TYPES.MAINNET);
    const controller = new DetectTokensController({
      messenger: getRestrictedMessenger(),
      preferences,
      network,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
      trackMetaMetricsEvent: noop,
      getCurrentSelectedAccount:
        accountsController.getSelectedAccount.bind(accountsController),
    });
    controller.isOpen = true;
    controller.isUnlocked = true;

    const { tokenList } = tokenListController.state;
    const erc20ContractAddresses = Object.keys(tokenList);

    const existingTokenAddress = erc20ContractAddresses[0];
    const existingToken = tokenList[existingTokenAddress];

    accountsController.setSelectedAccount(
      'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    );

    await tokensController.addDetectedTokens(
      [
        {
          address: existingToken.address,
          symbol: existingToken.symbol,
          decimals: existingToken.decimals,
          aggregators: undefined,
          image: undefined,
          isERC721: undefined,
        },
      ],
      {
        address: existingToken.address,
        symbol: existingToken.symbol,
        decimals: existingToken.decimals,
        aggregators: undefined,
        image: undefined,
        isERC721: undefined,
        name: undefined,
      },
    );
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
        name: undefined,
      },
      {
        address: toChecksumHexAddress(tokenAddressToAdd),
        decimals: tokenToAdd.decimals,
        symbol: tokenToAdd.symbol,
        aggregators: undefined,
        image: undefined,
        isERC721: undefined,
        name: undefined,
      },
    ]);
  });

  it('should trigger detect new tokens when change address', async function () {
    sandbox.useFakeTimers();
    const controller = new DetectTokensController({
      messenger: getRestrictedMessenger(),
      preferences,
      network,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
      getCurrentSelectedAccount:
        accountsController.getSelectedAccount.bind(accountsController),
    });
    controller.isOpen = true;
    controller.isUnlocked = true;
    const stub = sandbox.stub(controller, 'detectNewTokens');
    messenger.publish('AccountsController:selectedAccountChange', {
      id: 'mock-2',
      address: '0x999',
    });

    sandbox.assert.called(stub);
  });

  it('should trigger detect new tokens when submit password', async function () {
    sandbox.useFakeTimers();
    const controller = new DetectTokensController({
      messenger: getRestrictedMessenger(),
      preferences,
      network,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
      getCurrentSelectedAccount:
        accountsController.getSelectedAccount.bind(accountsController),
    });
    controller.isOpen = true;
    controller.selectedAddress = '0x0';
    const stub = sandbox.stub(controller, 'detectNewTokens');

    messenger.publish('KeyringController:unlock');

    sandbox.assert.called(stub);
    assert.equal(controller.isUnlocked, true);
  });

  it('should not be active after lock event is emitted', async function () {
    sandbox.useFakeTimers();
    const controller = new DetectTokensController({
      messenger: getRestrictedMessenger(),
      preferences,
      network,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
      getCurrentSelectedAccount:
        accountsController.getSelectedAccount.bind(accountsController),
    });
    controller.isOpen = true;

    messenger.publish('KeyringController:lock');

    assert.equal(controller.isUnlocked, false);
    assert.equal(controller.isActive, false);
  });

  it('should not trigger detect new tokens when not unlocked', async function () {
    const clock = sandbox.useFakeTimers();
    await network.setProviderType(NETWORK_TYPES.MAINNET);
    const controller = new DetectTokensController({
      messenger: getRestrictedMessenger(),
      preferences,
      network,
      tokenList: tokenListController,
      tokensController,
      assetsContractController,
      getCurrentSelectedAccount:
        accountsController.getSelectedAccount.bind(accountsController),
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
      messenger: getRestrictedMessenger(),
      preferences,
      network,
      tokensController,
      assetsContractController,
      getCurrentSelectedAccount:
        accountsController.getSelectedAccount.bind(accountsController),
    });
    // trigger state update from preferences controller
    accountsController.setSelectedAccount(
      '07c2cfec-36c9-46c4-8115-3836d3ac9047',
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

  it('should poll on the correct interval by networkClientId', async function () {
    jest.useFakeTimers();
    const controller = new DetectTokensController({
      messenger: getRestrictedMessenger(),
      preferences,
      network,
      tokensController,
      assetsContractController,
      disableLegacyInterval: true,
      interval: 1000,
      getCurrentSelectedAccount:
        accountsController.getSelectedAccount.bind(accountsController),
      getNetworkClientById: () => ({
        configuration: {
          chainId: '0x1',
        },
        provider: {},
        blockTracker: {},
        destroy: () => {
          // noop
        },
      }),
    });
    const detectNewTokensSpy = jest
      .spyOn(controller, 'detectNewTokens')
      .mockResolvedValue('foo');
    controller.startPollingByNetworkClientId('mainnet');
    await Promise.all([jest.advanceTimersByTime(0), flushPromises()]);
    expect(detectNewTokensSpy).toHaveBeenCalledTimes(1);
    await Promise.all([jest.advanceTimersByTime(1000), flushPromises()]);
    expect(detectNewTokensSpy).toHaveBeenCalledTimes(2);
    expect(detectNewTokensSpy.mock.calls).toStrictEqual([
      [{ chainId: '0x1' }],
      [{ chainId: '0x1' }],
    ]);

    detectNewTokensSpy.mockRestore();
    jest.useRealTimers();
  });

  it('should restart token detection on selected account change', async () => {
    const controller = new DetectTokensController({
      messenger,
      interval,
      preferences,
      network,
      tokensController,
      assetsContractController,
      getCurrentSelectedAccount,
      getNetworkClientById,
    });

    jest.spyOn(controller, 'restartTokenDetection');

    await ControllerMessenger.prototype.subscribe.mock.calls
      .filter((args) => args[0] === 'AccountsController:selectedAccountChange')
      .slice(-1)[0][1]({
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      });

    expect(controller.selectedAddress).toBe(
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    );
    expect(controller.restartTokenDetection).toHaveBeenCalledWith({
      selectedAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    });
  });

  it('should restart token detection on useTokenDetection change', async () => {
    const controller = new DetectTokensController({
      messenger,
      interval,
      preferences,
      network,
      tokensController,
      assetsContractController,
      getCurrentSelectedAccount,
      getNetworkClientById,
    });

    jest.spyOn(controller, 'restartTokenDetection');

    preferences.setUseTokenDetection(false);

    expect(controller.useTokenDetection).toBe(false);
    expect(controller.restartTokenDetection).toHaveBeenCalledWith({
      selectedAddress: '0xbc86727e770de68b1060c91f6bb6945c73e10388',
    });
  });

  it('should restart token detection on network state change', async () => {
    const controller = new DetectTokensController({
      messenger,
      interval,
      preferences,
      network,
      tokensController,
      assetsContractController,
      getCurrentSelectedAccount,
      getNetworkClientById,
    });

    jest.spyOn(controller, 'restartTokenDetection');

    await ControllerMessenger.prototype.subscribe.mock.calls
      .filter((args) => args[0] === 'NetworkController:stateChange')
      .slice(-1)[0][1]();

    expect(controller.chainId).toBe(controller.getChainIdFromNetworkStore());
    expect(controller.restartTokenDetection).toHaveBeenCalledTimes(0);

    controller.chainId = '0xaa36a7';

    await ControllerMessenger.prototype.subscribe.mock.calls
      .filter((args) => args[0] === 'NetworkController:stateChange')
      .slice(-1)[0][1]();

    expect(controller.chainId).toBe(controller.getChainIdFromNetworkStore());
    expect(controller.restartTokenDetection).toHaveBeenCalledWith({
      chainId: '0x1',
    });
  });
});
