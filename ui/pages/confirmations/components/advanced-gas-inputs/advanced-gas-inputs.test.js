import React from 'react';
import sinon from 'sinon';
import { renderWithProvider, fireEvent } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import AdvancedGasInputs from '.';

describe('AdvancedGasInputs', () => {
  let clock;

  const props = {
    updateCustomGasPrice: jest.fn(),
    updateCustomGasLimit: jest.fn(),
    showGasPriceInfoModal: jest.fn(),
    showGasLimitInfoModal: jest.fn(),
    customGasPrice: 0,
    customGasLimit: 0,
    insufficientBalance: false,
    customPriceIsSafe: true,
    isSpeedUp: false,
    minimumGasLimit: 21000,
  };

  const store = configureStore({});

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it("won't update gasPrice in props before debounce", () => {
    const { getByTestId } = renderWithProvider(
      <AdvancedGasInputs {...props} />,
      store,
    );

    fireEvent.change(getByTestId('gas-price'), { target: { value: '10' } });
    clock.tick(499);

    expect(props.updateCustomGasPrice).toHaveBeenCalledTimes(0);
  });

  it('simulates onChange on gas price after debounce', () => {
    const { getByTestId } = renderWithProvider(
      <AdvancedGasInputs {...props} />,
      store,
    );

    fireEvent.change(getByTestId('gas-price'), { target: { value: '10' } });
    clock.tick(500);

    expect(props.updateCustomGasPrice).toHaveBeenCalledTimes(1);
    expect(props.updateCustomGasPrice).toHaveBeenCalledWith('2540be400');
  });

  it('wont update gasLimit in props before debounce', () => {
    const { getByTestId } = renderWithProvider(
      <AdvancedGasInputs {...props} />,
      store,
    );

    fireEvent.change(getByTestId('gas-limit'), { target: { value: '21000' } });
    clock.tick(499);

    expect(props.updateCustomGasLimit).toHaveBeenCalledTimes(0);
  });

  it('simulates onChange on gas limit after debounce', () => {
    const { getByTestId } = renderWithProvider(
      <AdvancedGasInputs {...props} />,
      store,
    );

    fireEvent.change(getByTestId('gas-limit'), { target: { value: '21000' } });
    clock.tick(500);

    expect(props.updateCustomGasLimit).toHaveBeenCalledTimes(1);
    expect(props.updateCustomGasLimit).toHaveBeenCalledWith('5208');
  });

  it('errors when insufficientBalance under gas price and gas limit', () => {
    const { getAllByText } = renderWithProvider(
      <AdvancedGasInputs {...props} insufficientBalance />,
      store,
    );

    expect(getAllByText('Insufficient balance.')).toHaveLength(2);
  });

  it('errors zero gas price / speed up', () => {
    const { queryByText } = renderWithProvider(
      <AdvancedGasInputs {...props} isSpeedUp />,
      store,
    );

    expect(queryByText('Zero gas price on speed up')).toBeInTheDocument();
    expect(queryByText('Gas limit must be at least 21000')).toBeInTheDocument();
  });

  it('warns when custom gas price is too low', () => {
    const { queryByText } = renderWithProvider(
      <AdvancedGasInputs {...props} customPriceIsSafe={false} />,
      store,
    );

    expect(queryByText('Gas price extremely low')).toBeInTheDocument();
  });

  it('errors when custom gas price is too excessive', () => {
    const { queryByText } = renderWithProvider(
      <AdvancedGasInputs {...props} customPriceIsExcessive />,
      store,
    );

    expect(queryByText('Gas price is excessive')).toBeInTheDocument();
  });
});
