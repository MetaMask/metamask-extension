import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import AdvancedTabContent from './advanced-gas-inputs.container';

describe('Advanced Gas Inputs', () => {
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

  beforeEach(() => {
    clock = sinon.useFakeTimers();

    wrapper = mount(<AdvancedTabContent.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    });
  });

  afterEach(() => {
    clock.restore();
  });

  it('wont update gasPrice in props before debounce', () => {
    const event = { target: { value: 1 } };

    wrapper.find('input').at(0).simulate('change', event);
    clock.tick(499);

    expect(props.updateCustomGasPrice.callCount).toStrictEqual(0);
  });

  it('simulates onChange on gas price after debounce', () => {
    const event = { target: { value: 1 } };

    wrapper.find('input').at(0).simulate('change', event);
    clock.tick(500);

    expect(props.updateCustomGasPrice.calledOnce).toStrictEqual(true);
    expect(props.updateCustomGasPrice.calledWith(1)).toStrictEqual(true);
  });

  it('wont update gasLimit in props before debounce', () => {
    const event = { target: { value: 21000 } };

    wrapper.find('input').at(1).simulate('change', event);
    clock.tick(499);

    expect(props.updateCustomGasLimit.callCount).toStrictEqual(0);
  });

  it('simulates onChange on gas limit after debounce', () => {
    const event = { target: { value: 21000 } };

    wrapper.find('input').at(1).simulate('change', event);
    clock.tick(500);

    expect(props.updateCustomGasLimit.calledOnce).toStrictEqual(true);
    expect(props.updateCustomGasLimit.calledWith(21000)).toStrictEqual(true);
  });

  it('errors when insufficientBalance under gas price and gas limit', () => {
    wrapper.setProps({ insufficientBalance: true });
    const renderError = wrapper.find(
      '.advanced-gas-inputs__gas-edit-row__error-text',
    );
    expect(renderError).toHaveLength(2);

    expect(renderError.at(0).text()).toStrictEqual('insufficientBalance');
    expect(renderError.at(1).text()).toStrictEqual('insufficientBalance');
  });

  it('errors zero gas price / speed up', () => {
    wrapper.setProps({ isSpeedUp: true });

    const renderError = wrapper.find(
      '.advanced-gas-inputs__gas-edit-row__error-text',
    );
    expect(renderError).toHaveLength(2);

    expect(renderError.at(0).text()).toStrictEqual(
      'zeroGasPriceOnSpeedUpError',
    );
    expect(renderError.at(1).text()).toStrictEqual(
      'gasLimitTooLowWithDynamicFee',
    );
  });

  it('warns when custom gas price is too low', () => {
    wrapper.setProps({ customPriceIsSafe: false });

    const renderWarning = wrapper.find(
      '.advanced-gas-inputs__gas-edit-row__warning-text',
    );
    expect(renderWarning).toHaveLength(1);

    expect(renderWarning.text()).toStrictEqual('gasPriceExtremelyLow');
  });

  it('errors when custom gas price is too excessive', () => {
    wrapper.setProps({ customPriceIsExcessive: true });

    const renderError = wrapper.find(
      '.advanced-gas-inputs__gas-edit-row__error-text',
    );

    expect(renderError).toHaveLength(2);
    expect(renderError.at(0).text()).toStrictEqual('gasPriceExcessiveInput');
  });
});
