import React from 'react';
import { fireEvent, within } from '@testing-library/react';
import configureMockState from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import IncomingTransactionToggle from './incoming-transaction-toggle';

const mockTrackEvent = jest.fn();
const ALL_NETWORKS_DATA = [
  {
    chainId: '0x1',
    nickname: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
    rpcPrefs: {
      imageUrl: './images/eth_logo.png',
    },
    providerType: 'mainnet',
    ticker: 'ETH',
    id: 'mainnet',
    removable: false,
  },
  {
    chainId: '0xe708',
    nickname: 'Linea Mainnet',
    rpcUrl:
      'https://linea-mainnet.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
    rpcPrefs: {
      imageUrl: './images/linea-logo-mainnet.png',
    },
    providerType: 'linea-mainnet',
    id: 'linea-mainnet',
    removable: false,
  },
  {
    chainId: '0xfa',
    nickname: 'FANTOM',
    rpcPrefs: {},
    rpcUrl: 'http://ftmscan.com5',
    ticker: 'FTM',
  },
  {
    chainId: '0x5',
    nickname: 'Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
    providerType: 'goerli',
    ticker: 'GoerliETH',
    id: 'goerli',
    removable: false,
  },
  {
    chainId: '0xaa36a7',
    nickname: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
    providerType: 'sepolia',
    ticker: 'SepoliaETH',
    id: 'sepolia',
    removable: false,
  },
  {
    chainId: '0xe704',
    nickname: 'Linea Goerli',
    rpcUrl:
      'https://linea-goerli.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
    rpcPrefs: {
      imageUrl: './images/linea-logo-testnet.png',
    },
    providerType: 'linea-goerli',
    ticker: 'LineaETH',
    id: 'linea-goerli',
    removable: false,
  },
];

const INCOMING_DATA = {
  '0x1': true,
  '0xe708': false,
  '0xfa': true,
  '0x5': false,
  '0xaa36a7': true,
  '0xe704': true,
};

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
    const enableForAllCheckbox = within(
      getByTestId('incoming-transaction-toggle-enable-all'),
    ).getByRole('checkbox');
    expect(enableForAllCheckbox.checked).toStrictEqual(false);

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

  it('should trigger settle for all when click toggle all button', () => {
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
    const enableForAllCheckbox = within(
      getByTestId('incoming-transaction-toggle-enable-all'),
    ).getByRole('checkbox');
    fireEvent.click(enableForAllCheckbox);
    // set 2 false to true
    expect(setIncomingTransactionsPreferencesStub).toHaveBeenCalledTimes(2);
    expect(
      setIncomingTransactionsPreferencesStub.mock.calls[0][0],
    ).toStrictEqual('0xe708');
    expect(
      setIncomingTransactionsPreferencesStub.mock.calls[0][1],
    ).toStrictEqual(true);
    expect(
      setIncomingTransactionsPreferencesStub.mock.calls[1][0],
    ).toStrictEqual('0x5');
    expect(
      setIncomingTransactionsPreferencesStub.mock.calls[1][1],
    ).toStrictEqual(true);
  });

  it('should trigger settle for one when click toggle one button', () => {
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
