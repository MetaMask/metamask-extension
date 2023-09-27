import React from 'react';
import { fireEvent, within } from '@testing-library/react';
import configureMockState from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import IncomingTransactionToggle from './incoming-transaction-toggle';
import { ALL_NETWORKS_DATA, INCOMING_DATA } from './mock-data';

const mockTrackEvent = jest.fn();

describe('IncomingTransactionToggle', () => {
  const mockStore = configureMockState([thunk])(mockState);
  let setIncomingTransactionsPreferencesStub;

  beforeEach(() => {
    setIncomingTransactionsPreferencesStub = jest.fn();
  });

  it('should render existing incoming transaction preferences', () => {
    const { container, getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <IncomingTransactionToggle
          setIncomingTransactionsPreferences={
            setIncomingTransactionsPreferencesStub
          }
          allNetworks={ALL_NETWORKS_DATA}
          incomingTransactionsPreferences={INCOMING_DATA}
        />
      </MetaMetricsContext.Provider>,
      mockStore,
    );
    expect(container).toMatchSnapshot();

    const ethMainnetCheckbox = within(
      getByTestId(`network-toggle-${ALL_NETWORKS_DATA[0].chainId}`),
    ).getByRole('checkbox');
    expect(ethMainnetCheckbox.value).toStrictEqual('true');
    const lineaMainnetCheckbox = within(
      getByTestId(`network-toggle-${ALL_NETWORKS_DATA[1].chainId}`),
    ).getByRole('checkbox');
    expect(lineaMainnetCheckbox.value).toStrictEqual('false');
    const fantomCheckbox = within(
      getByTestId(`network-toggle-${ALL_NETWORKS_DATA[2].chainId}`),
    ).getByRole('checkbox');
    expect(fantomCheckbox.value).toStrictEqual('true');
    const goerliCheckbox = within(
      getByTestId(`network-toggle-${ALL_NETWORKS_DATA[3].chainId}`),
    ).getByRole('checkbox');
    expect(goerliCheckbox.value).toStrictEqual('false');
    const sepoliaCheckbox = within(
      getByTestId(`network-toggle-${ALL_NETWORKS_DATA[4].chainId}`),
    ).getByRole('checkbox');
    expect(sepoliaCheckbox.value).toStrictEqual('true');
    const lineaGoerliCheckbox = within(
      getByTestId(`network-toggle-${ALL_NETWORKS_DATA[5].chainId}`),
    ).getByRole('checkbox');
    expect(lineaGoerliCheckbox.value).toStrictEqual('true');
  });

  it('should settle the preference when click toggle one button', () => {
    const { getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <IncomingTransactionToggle
          setIncomingTransactionsPreferences={
            setIncomingTransactionsPreferencesStub
          }
          allNetworks={ALL_NETWORKS_DATA}
          incomingTransactionsPreferences={INCOMING_DATA}
        />
      </MetaMetricsContext.Provider>,
      mockStore,
    );
    const lineaMainnetCheckbox = within(
      getByTestId(`network-toggle-${ALL_NETWORKS_DATA[1].chainId}`),
    ).getByRole('checkbox');
    fireEvent.click(lineaMainnetCheckbox);
    // set 1 false to true
    expect(setIncomingTransactionsPreferencesStub).toHaveBeenCalledTimes(1);
    expect(
      setIncomingTransactionsPreferencesStub.mock.calls[0][0],
    ).toStrictEqual('0xe708');
    expect(
      setIncomingTransactionsPreferencesStub.mock.calls[0][1],
    ).toStrictEqual(true);

    // set 1 false to true
    const goerliCheckbox = within(
      getByTestId(`network-toggle-${ALL_NETWORKS_DATA[3].chainId}`),
    ).getByRole('checkbox');
    fireEvent.click(goerliCheckbox);
    expect(
      setIncomingTransactionsPreferencesStub.mock.calls[1][0],
    ).toStrictEqual('0x5');
    expect(
      setIncomingTransactionsPreferencesStub.mock.calls[1][1],
    ).toStrictEqual(true);
  });
});
