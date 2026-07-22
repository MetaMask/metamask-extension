/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import RampsChangeProviderFooter from './ramps-change-provider-footer';

const createStore = () =>
  configureStore({
    metamask: {
      selectedNetworkClientId: 'mainnet',
      networkConfigurationsByChainId: {
        '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
      },
      currentCurrency: 'usd',
    },
  });

describe('RampsChangeProviderFooter', () => {
  it('matches snapshot', () => {
    const { container } = renderWithProvider(
      <RampsChangeProviderFooter
        providerName="Transak"
        onChangeProvider={jest.fn()}
      />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when disabled', () => {
    const { container } = renderWithProvider(
      <RampsChangeProviderFooter
        providerName="Transak"
        isDisabled
        onChangeProvider={jest.fn()}
      />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('calls onChangeProvider when clicked', () => {
    const onChangeProvider = jest.fn();

    renderWithProvider(
      <RampsChangeProviderFooter
        providerName="Transak"
        onChangeProvider={onChangeProvider}
      />,
      createStore(),
    );

    fireEvent.click(screen.getByTestId('ramps-change-provider-button'));
    expect(onChangeProvider).toHaveBeenCalledTimes(1);
  });
});
