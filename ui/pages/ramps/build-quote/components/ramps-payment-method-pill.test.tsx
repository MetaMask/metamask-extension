/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import RampsPaymentMethodPill from './ramps-payment-method-pill';

const createStore = () =>
  configureStore({
    metamask: {
      selectedNetworkClientId: 'mainnet',
      networkConfigurationsByChainId: {
        '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
      },
    },
  });

describe('RampsPaymentMethodPill', () => {
  it('matches snapshot', () => {
    const { container } = renderWithProvider(
      <RampsPaymentMethodPill label="Debit card" onClick={jest.fn()} />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot while loading', () => {
    const { container } = renderWithProvider(
      <RampsPaymentMethodPill label="Debit card" isLoading />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('calls onClick when pressed', () => {
    const onClick = jest.fn();

    renderWithProvider(
      <RampsPaymentMethodPill label="Debit card" onClick={onClick} />,
      createStore(),
    );

    fireEvent.click(screen.getByTestId('ramps-payment-method-pill'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
