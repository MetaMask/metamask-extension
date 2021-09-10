import { strict as assert } from 'assert';
import sinon from 'sinon';
import { TokensController } from '@metamask/controllers';
import TokenRatesController from './token-rates';
import NetworkController from './network';
import PreferencesController from './preferences';

const networkControllerProviderConfig = {
  getAccounts: () => undefined,
};

describe('TokenRatesController', function () {
  let nativeCurrency,
    getNativeCurrency,
    network,
    provider,
    preferences,
    tokensController;
  beforeEach(function () {
    nativeCurrency = 'ETH';
    getNativeCurrency = () => nativeCurrency;
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
    sinon.stub(network, 'getLatestBlock').callsFake(() => Promise.resolve({}));
    sinon.stub(tokensController, '_instantiateNewEthersProvider').returns(null);
    sinon
      .stub(tokensController, '_detectIsERC721')
      .returns(Promise.resolve(false));
  });
  it('should listen for tokenControllers state updates', async function () {
    const controller = new TokenRatesController({
      tokensController,
      getNativeCurrency,
    });
    await tokensController.addToken('0x1', 'TEST', 1);
    assert.deepEqual(controller._tokens, [
      {
        address: '0x1',
        decimals: 1,
        symbol: 'TEST',
        image: undefined,
        isERC721: false,
      },
    ]);
  });

  it('should poll on correct interval', async function () {
    const stub = sinon.stub(global, 'setInterval');
    const controller = new TokenRatesController({
      tokensController,
      getNativeCurrency,
    });
    controller.start(1337);

    assert.strictEqual(stub.getCall(0).args[1], 1337);
    stub.restore();
    controller.stop();
  });
});
