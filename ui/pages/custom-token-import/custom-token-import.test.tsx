import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import {
  en as messages,
  renderWithProvider,
} from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { CUSTOM_TOKEN_IMPORT_ROUTE } from '../../helpers/constants/routes';
import { CustomTokenImportPage } from './custom-token-import';

// The page kicks off real on-chain probes through `getTokenStandardAndDetailsByChain`
// and `tokenInfoGetter`. Replace them with deterministic stubs so the unit
// test never reaches the background script.
jest.mock('../../store/actions', () => {
  const actual = jest.requireActual('../../store/actions');
  return {
    ...actual,
    getTokenStandardAndDetailsByChain: jest.fn().mockResolvedValue({
      standard: 'ERC20',
      symbol: 'APE',
      decimals: '18',
    }),
  };
});

jest.mock('../../helpers/utils/token-util', () => {
  const actual = jest.requireActual('../../helpers/utils/token-util');
  return {
    ...actual,
    tokenInfoGetter: () => async () => ({
      symbol: 'APE',
      decimals: 18,
      name: 'ApeCoin',
    }),
  };
});

describe('CustomTokenImportPage', () => {
  const buildState = () => ({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      selectedNetworkClientId: 'mainnet',
      selectedMultichainNetworkChainId: 'eip155:1',
      networkConfigurationsByChainId: {
        ...mockState.metamask.networkConfigurationsByChainId,
        '0x1': {
          chainId: '0x1',
          name: 'Ethereum Mainnet',
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'mainnet',
              type: 'infura',
              url: 'https://mainnet.infura.io/v3/',
            },
          ],
        },
      },
    },
  });

  const renderPage = () => {
    const store = configureStore(buildState());
    return {
      store,
      ...renderWithProvider(
        <CustomTokenImportPage />,
        store,
        CUSTOM_TOKEN_IMPORT_ROUTE,
      ),
    };
  };

  it('renders the form scaffolding without crashing', () => {
    renderPage();

    expect(screen.getByTestId('custom-token-import-page')).toBeInTheDocument();
    expect(
      screen.getByTestId('custom-token-import-address-input'),
    ).toBeInTheDocument();
    // Symbol/decimal fields are gated behind a valid address entry.
    expect(
      screen.queryByTestId('custom-token-import-symbol-input'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('custom-token-import-decimal-input'),
    ).not.toBeInTheDocument();
  });

  it('keeps the submit button disabled while the address field is empty', () => {
    renderPage();

    const submit = screen.getByTestId('custom-token-import-submit-button');
    expect(submit).toBeDisabled();
  });

  it('flags an invalid contract address', () => {
    renderPage();

    const input = screen.getByTestId(
      'custom-token-import-address-input',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '0xnot-an-address' } });

    expect(
      screen.getByText(messages.invalidAddress.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('custom-token-import-submit-button'),
    ).toBeDisabled();
  });

  it('opens the custom import network selector when the network picker is clicked', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('network-selector'));

    expect(
      screen.getByText(messages.networkMenuHeading.message),
    ).toBeInTheDocument();

    const networkItems = screen.getAllByTestId(/select-network-item-/u);
    expect(networkItems.length).toBeGreaterThan(0);
  });
});
