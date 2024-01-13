import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  renderWithProvider,
  fireEvent,
  createSwapsMockStore,
} from '../../../../test/jest';
import { Slippage } from '../../../../shared/constants/swaps';
import TransactionSettings from './transaction-settings';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useDispatch: () => jest.fn(),
  };
});

const createProps = (customProps = {}) => {
  return {
    onSelect: jest.fn(),
    onModalClose: jest.fn(),
    maxAllowedSlippage: 15,
    currentSlippage: Slippage.high,
    smartTransactionsEnabled: false,
    ...customProps,
  };
};

const middleware = [thunk];

describe('TransactionSettings', () => {
  let store;

  beforeEach(() => {
    const swapsMockStore = createSwapsMockStore();
    store = configureMockStore(middleware)(swapsMockStore);
  });

  it('renders the component with initial props', () => {
    const { getByText, queryByText, getByTestId } = renderWithProvider(
      <TransactionSettings {...createProps()} />,
      store,
    );
    expect(getByText('2%')).toBeInTheDocument();
    expect(getByText('3%')).toBeInTheDocument();
    expect(getByText('custom')).toBeInTheDocument();
    expect(
      document.querySelector('.transaction-settings__button-group'),
    ).toMatchSnapshot();
    expect(queryByText('Smart Swaps')).not.toBeInTheDocument();
    expect(getByTestId('button-group__button1')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('renders the component with the smart transaction opt-in button available, opt into STX', async () => {
    const setSmartTransactionsOptInStatus = jest.fn();
    const { getByText, getByTestId } = renderWithProvider(
      <TransactionSettings
        {...createProps({
          smartTransactionsEnabled: true,
          setSmartTransactionsOptInStatus,
        })}
      />,
      store,
    );
    expect(getByText('2%')).toBeInTheDocument();
    expect(getByText('3%')).toBeInTheDocument();
    expect(getByText('custom')).toBeInTheDocument();
    expect(
      document.querySelector('.transaction-settings__header'),
    ).toMatchSnapshot();
    expect(
      document.querySelector('.transaction-settings__button-group'),
    ).toMatchSnapshot();
    expect(getByText('Smart Swaps')).toBeInTheDocument();
    expect(document.querySelector('.toggle-button--off')).toBeInTheDocument();
    await fireEvent.click(document.querySelector('.toggle-button'));
    await fireEvent.click(getByTestId('update-transaction-settings-button'));
    expect(setSmartTransactionsOptInStatus).toHaveBeenCalledWith(true);
  });

  it('renders slippage with a custom value', () => {
    const { getByText } = renderWithProvider(
      <TransactionSettings {...createProps({ currentSlippage: 2.5 })} />,
      store,
    );
    expect(getByText('2.5')).toBeInTheDocument();
  });

  it('sets a default slippage', () => {
    const { getByTestId } = renderWithProvider(
      <TransactionSettings
        {...createProps({ currentSlippage: Slippage.default })}
      />,
      store,
    );
    fireEvent.click(getByTestId('button-group__button0'));
    expect(getByTestId('button-group__button0')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('sets a high slippage', () => {
    const { getByTestId } = renderWithProvider(
      <TransactionSettings
        {...createProps({ currentSlippage: Slippage.default })}
      />,
      store,
    );
    fireEvent.click(getByTestId('button-group__button1'));
    expect(getByTestId('button-group__button1')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('sets a custom slippage value', () => {
    const { getByTestId } = renderWithProvider(
      <TransactionSettings {...createProps()} />,
      store,
    );
    fireEvent.click(getByTestId('button-group__button2'));
    expect(getByTestId('button-group__button2')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    const input = getByTestId('transaction-settings-custom-slippage');
    fireEvent.change(input, { target: { value: 5 } });
    fireEvent.click(document);
    expect(input).toHaveAttribute('value', '5');
  });
});
