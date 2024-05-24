import React from 'react';
import { Provider } from 'react-redux';
import { fireEvent, render } from '@testing-library/react';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import configureStore from '../../../../store/store';
import { NFTInput } from './nft-input';

const createStore = ({
  useNativeCurrencyAsPrimaryCurrency,
  sendInputCurrencySwitched,
}: Record<string, boolean>) =>
  configureStore({
    ...mockSendState,
    metamask: {
      ...mockSendState.metamask,
      preferences: { useNativeCurrencyAsPrimaryCurrency },
    },
    appState: { ...mockSendState.appState, sendInputCurrencySwitched },
  });

describe('NFTInput', () => {
  it('matches snapshot', () => {
    const mockAssetChange = jest.fn();

    const { asFragment } = render(
      <Provider
        store={createStore({
          useNativeCurrencyAsPrimaryCurrency: true,
          sendInputCurrencySwitched: true,
        })}
      >
        <NFTInput integerValue={1} onChange={() => mockAssetChange()} />
      </Provider>,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('disables input when change handler is not passed', () => {
    const { getByTestId } = render(
      <Provider
        store={createStore({
          useNativeCurrencyAsPrimaryCurrency: true,
          sendInputCurrencySwitched: true,
        })}
      >
        <NFTInput integerValue={1} />
      </Provider>,
    );

    expect(getByTestId('nft-input')).toBeDisabled();
  });

  it('registers changes', () => {
    const mockAssetChange = jest.fn();

    const { queryByTestId } = render(
      <Provider
        store={createStore({
          useNativeCurrencyAsPrimaryCurrency: true,
          sendInputCurrencySwitched: true,
        })}
      >
        <NFTInput integerValue={0} onChange={mockAssetChange} />
      </Provider>,
    );

    const input = queryByTestId('nft-input');
    expect(input).toBeInTheDocument();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    fireEvent.change(input!, { target: { value: '10' } });

    expect(mockAssetChange).toHaveBeenCalledWith('0xa', '10');
  });
});
