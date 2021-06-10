import { strict as assert } from 'assert';
import sinon from 'sinon';
import { ObservableStore } from '@metamask/obs-store';
import TokenRatesController from './token-rates';

describe('TokenRatesController', function () {
  let nativeCurrency;
  let getNativeCurrency;
  beforeEach(function () {
    nativeCurrency = 'ETH';
    getNativeCurrency = () => nativeCurrency;
  });
  it('should listen for preferences store updates', function () {
    const preferences = new ObservableStore({ tokens: [] });
    preferences.putState({ tokens: ['foo'] });
    const controller = new TokenRatesController({
      preferences,
      getNativeCurrency,
    });
    assert.deepEqual(controller._tokens, ['foo']);
  });

  it('should poll on correct interval', async function () {
    const stub = sinon.stub(global, 'setInterval');
    const preferences = new ObservableStore({ tokens: [] });
    preferences.putState({ tokens: ['foo'] });
    const controller = new TokenRatesController({
      preferences,
      getNativeCurrency,
    });
    controller.start(1337);

    assert.strictEqual(stub.getCall(0).args[1], 1337);
    stub.restore();
    controller.stop();
  });
});
