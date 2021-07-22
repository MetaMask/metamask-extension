import { strict as assert } from 'assert';
import sinon from 'sinon';
import { ObservableStore } from '@metamask/obs-store';
import contracts from '@metamask/contract-metadata';
import BigNumber from 'bignumber.js';

import { TokensController } from '@metamask/controllers';
import { MAINNET, ROPSTEN } from '../../../shared/constants/network';
import DetectTokensController from './detect-tokens';
import NetworkController from './network';
import PreferencesController from './preferences';

describe('DetectTokensController', function () {
  const sandbox = sinon.createSandbox();
  let keyringMemStore, network, preferences, provider, tokensController;

  const noop = () => undefined;

  const networkControllerProviderConfig = {
    getAccounts: noop,
  };

  beforeEach(async function () {
    keyringMemStore = new ObservableStore({ isUnlocked: false });
    network = new NetworkController();
    network.setInfuraProjectId('foo');
    network.initializeProvider(networkControllerProviderConfig);
    provider = network.getProviderAndBlockTracker().provider;
    preferences = new PreferencesController({ network, provider });
    tokensController = new TokensController({
      onPreferencesStateChange: preferences.store.subscribe.bind(
        preferences.store,
      ),
      onNetworkStateChange: network.store.subscribe.bind(network.store),
    });
    preferences.setAddresses([
      '0x7e57e2',
      '0xbc86727e770de68b1060c91f6bb6945c73e10388',
    ]);
    sandbox
      .stub(network, 'getLatestBlock')
      .callsFake(() => Promise.resolve({}));
    sandbox
      .stub(tokensController, '_instantiateNewEthersProvider')
      .returns(null);
    sandbox
      .stub(tokensController, '_detectIsERC721')
      .returns(Promise.resolve(false));
  });

  after(function () {
    sandbox.restore();
  });

  it('should poll on correct interval', async function () {
    const stub = sinon.stub(global, 'setInterval');
    new DetectTokensController({ interval: 1337 }); // eslint-disable-line no-new
    assert.strictEqual(stub.getCall(0).args[1], 1337);
    stub.restore();
  });

  it('should be called on every polling period', async function () {
    const clock = sandbox.useFakeTimers();
    network.setProviderType(MAINNET);
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
      tokensController,
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

  it('should not check tokens while on test network', async function () {
    sandbox.useFakeTimers();
    network.setProviderType(ROPSTEN);
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
      tokensController,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;

    const stub = sandbox.stub(controller, '_getTokenBalances');

    await controller.detectNewTokens();
    sandbox.assert.notCalled(stub);
  });

  it('should skip adding tokens listed in hiddenTokens array', async function () {
    sandbox.useFakeTimers();
    network.setProviderType(MAINNET);
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
      tokensController,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;

    const contractAddresses = Object.keys(contracts);
    const erc20ContractAddresses = contractAddresses.filter(
      (contractAddress) => contracts[contractAddress].erc20 === true,
    );

    const existingTokenAddress = erc20ContractAddresses[0];
    const existingToken = contracts[existingTokenAddress];
    await tokensController.addToken(
      existingTokenAddress,
      existingToken.symbol,
      existingToken.decimals,
    );

    const tokenAddressToSkip = erc20ContractAddresses[1];

    sandbox
      .stub(controller, '_getTokenBalances')
      .callsFake((tokensToDetect) =>
        tokensToDetect.map((token) =>
          token === tokenAddressToSkip ? new BigNumber(10) : 0,
        ),
      );

    await tokensController.removeAndIgnoreToken(tokenAddressToSkip);
    await controller.detectNewTokens();

    assert.deepEqual(tokensController.state.tokens, [
      {
        address: existingTokenAddress,
        decimals: existingToken.decimals,
        symbol: existingToken.symbol,
        image: undefined,
        isERC721: false,
      },
    ]);
  });

  it('should check and add tokens while on main network', async function () {
    sandbox.useFakeTimers();
    network.setProviderType(MAINNET);
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
      tokensController,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;

    const contractAddresses = Object.keys(contracts);
    const erc20ContractAddresses = contractAddresses.filter(
      (contractAddress) => contracts[contractAddress].erc20 === true,
    );

    const existingTokenAddress = erc20ContractAddresses[0];
    const existingToken = contracts[existingTokenAddress];
    await tokensController.addToken(
      existingTokenAddress,
      existingToken.symbol,
      existingToken.decimals,
    );

    const tokenAddressToAdd = erc20ContractAddresses[1];
    const tokenToAdd = contracts[tokenAddressToAdd];

    const indexOfTokenToAdd = contractAddresses.indexOf(tokenAddressToAdd);

    const balances = new Array(contractAddresses.length);
    balances[indexOfTokenToAdd] = new BigNumber(10);

    sandbox
      .stub(controller, '_getTokenBalances')
      .returns(Promise.resolve(balances));

    await controller.detectNewTokens();
    assert.deepEqual(tokensController.state.tokens, [
      {
        address: existingTokenAddress,
        decimals: existingToken.decimals,
        symbol: existingToken.symbol,
        isERC721: false,
        image: undefined,
      },
      {
        address: tokenAddressToAdd,
        decimals: tokenToAdd.decimals,
        symbol: tokenToAdd.symbol,
        image: undefined,
        isERC721: false,
      },
    ]);
  });

  it('should check and add tokens while on non-default Mainnet', async function () {
    sandbox.useFakeTimers();
    network.setRpcTarget('https://some-fake-RPC-endpoint.metamask.io', '0x1');
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
      tokensController,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;

    const contractAddresses = Object.keys(contracts);
    const erc20ContractAddresses = contractAddresses.filter(
      (contractAddress) => contracts[contractAddress].erc20 === true,
    );

    const existingTokenAddress = erc20ContractAddresses[0];
    const existingToken = contracts[existingTokenAddress];
    await tokensController.addToken(
      existingTokenAddress,
      existingToken.symbol,
      existingToken.decimals,
    );

    const tokenAddressToAdd = erc20ContractAddresses[1];
    const tokenToAdd = contracts[tokenAddressToAdd];

    const indexOfTokenToAdd = contractAddresses.indexOf(tokenAddressToAdd);

    const balances = new Array(contractAddresses.length);
    balances[indexOfTokenToAdd] = new BigNumber(10);

    sandbox
      .stub(controller, '_getTokenBalances')
      .returns(Promise.resolve(balances));

    await controller.detectNewTokens();

    assert.deepEqual(tokensController.state.tokens, [
      {
        address: existingTokenAddress,
        decimals: existingToken.decimals,
        symbol: existingToken.symbol,
        image: undefined,
        isERC721: false,
      },
      {
        address: tokenAddressToAdd,
        decimals: tokenToAdd.decimals,
        symbol: tokenToAdd.symbol,
        image: undefined,
        isERC721: false,
      },
    ]);
  });

  it('should trigger detect new tokens when change address', async function () {
    sandbox.useFakeTimers();
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
      tokensController,
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
      preferences,
      network,
      keyringMemStore,
      tokensController,
    });
    controller.isOpen = true;
    controller.selectedAddress = '0x0';
    const stub = sandbox.stub(controller, 'detectNewTokens');
    await controller._keyringMemStore.updateState({ isUnlocked: true });
    sandbox.assert.called(stub);
  });

  it('should not trigger detect new tokens when not unlocked', async function () {
    const clock = sandbox.useFakeTimers();
    network.setProviderType(MAINNET);
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
      tokensController,
    });
    controller.isOpen = true;
    controller.isUnlocked = false;
    const stub = sandbox.stub(controller, '_getTokenBalances');
    clock.tick(180000);
    sandbox.assert.notCalled(stub);
  });

  it('should not trigger detect new tokens when not open', async function () {
    const clock = sandbox.useFakeTimers();
    network.setProviderType(MAINNET);
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
      tokensController,
    });
    // trigger state update from preferences controller
    await preferences.setSelectedAddress(
      '0xbc86727e770de68b1060c91f6bb6945c73e10388',
    );
    controller.isOpen = false;
    controller.isUnlocked = true;
    const stub = sandbox.stub(controller, '_getTokenBalances');
    clock.tick(180000);
    sandbox.assert.notCalled(stub);
  });
});
