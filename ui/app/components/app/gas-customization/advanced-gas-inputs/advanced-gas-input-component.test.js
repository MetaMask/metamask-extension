import assert from 'assert';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import AdvancedTabContent from './advanced-gas-inputs.container';

describe('Advanced Gas Inputs', function () {
  let wrapper, clock;

  const props = {
    updateCustomGasPrice: sinon.spy(),
    updateCustomGasLimit: sinon.spy(),
    showGasPriceInfoModal: sinon.spy(),
    showGasLimitInfoModal: sinon.spy(),
    customGasPrice: 0,
    customGasLimit: 0,
    insufficientBalance: false,
    customPriceIsSafe: true,
    isSpeedUp: false,
    minimumGasLimit: 21000,
  };

  beforeEach(function () {
    clock = sinon.useFakeTimers();

    wrapper = mount(<AdvancedTabContent.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    });
  });

  afterEach(function () {
    clock.restore();
  });

  it('wont update gasPrice in props before debounce', function () {
    const event = { target: { value: 1 } };

    wrapper.find('input').at(0).simulate('change', event);
    clock.tick(499);

    assert.strictEqual(props.updateCustomGasPrice.callCount, 0);
  });

  it('simulates onChange on gas price after debounce', function () {
    const event = { target: { value: 1 } };

    wrapper.find('input').at(0).simulate('change', event);
    clock.tick(500);

    assert.strictEqual(props.updateCustomGasPrice.calledOnce, true);
    assert.strictEqual(props.updateCustomGasPrice.calledWith(1), true);
  });

  it('wont update gasLimit in props before debounce', function () {
    const event = { target: { value: 21000 } };

    wrapper.find('input').at(1).simulate('change', event);
    clock.tick(499);

    assert.strictEqual(props.updateCustomGasLimit.callCount, 0);
  });

  it('simulates onChange on gas limit after debounce', function () {
    const event = { target: { value: 21000 } };

    wrapper.find('input').at(1).simulate('change', event);
    clock.tick(500);

    assert.strictEqual(props.updateCustomGasLimit.calledOnce, true);
    assert.strictEqual(props.updateCustomGasLimit.calledWith(21000), true);
  });

  it('errors when insufficientBalance under gas price and gas limit', function () {
    wrapper.setProps({ insufficientBalance: true });
    const renderError = wrapper.find(
      '.advanced-gas-inputs__gas-edit-row__error-text',
    );
    assert.strictEqual(renderError.length, 2);

    assert.strictEqual(renderError.at(0).text(), 'insufficientBalance');
    assert.strictEqual(renderError.at(1).text(), 'insufficientBalance');
  });

  it('errors zero gas price / speed up', function () {
    wrapper.setProps({ isSpeedUp: true });

    const renderError = wrapper.find(
      '.advanced-gas-inputs__gas-edit-row__error-text',
    );
    assert.strictEqual(renderError.length, 2);

    assert.strictEqual(renderError.at(0).text(), 'zeroGasPriceOnSpeedUpError');
    assert.strictEqual(
      renderError.at(1).text(),
      'gasLimitTooLowWithDynamicFee',
    );
  });

  it('warns when custom gas price is too low', function () {
    wrapper.setProps({ customPriceIsSafe: false });

    const renderWarning = wrapper.find(
      '.advanced-gas-inputs__gas-edit-row__warning-text',
    );
    assert.strictEqual(renderWarning.length, 1);

    assert.strictEqual(renderWarning.text(), 'gasPriceExtremelyLow');
  });

  it('errors when custom gas price is too excessive', function () {
    wrapper.setProps({ customPriceIsExcessive: true });

    const renderError = wrapper.find(
      '.advanced-gas-inputs__gas-edit-row__error-text',
    );

    assert.strictEqual(renderError.length, 2);
    assert.strictEqual(renderError.at(0).text(), 'gasPriceExcessiveInput');
  });
});
