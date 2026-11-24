import React from 'react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';
import { type SafeChain } from '../../../multichain/networks-form/use-safe-chains';
import { NativeTokenScamWarningModal } from './native-token-scam-warning-modal';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

const token = { chainId: '0x1' as const, symbol: 'FAKE' };

const safeChains: SafeChain[] = [
  {
    chainId: '1',
    name: 'Ethereum Mainnet',
    nativeCurrency: { symbol: 'ETH' },
    rpc: [],
  },
];

describe('NativeTokenScamWarningModal', () => {
  const renderModal = ({
    chains,
    onClose = jest.fn(),
  }: {
    chains?: SafeChain[];
    onClose?: () => void;
  } = {}) => {
    const store = configureMockStore([thunk])({ metamask: {} });
    const result = renderWithProvider(
      <NativeTokenScamWarningModal
        token={token}
        safeChains={chains}
        onClose={onClose}
      />,
      store,
    );
    return { ...result, store, onClose };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title and the token and expected symbols', () => {
    const { getByText } = renderModal({ chains: safeChains });

    expect(
      getByText(messages.nativeTokenScamWarningTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(
        messages.nativeTokenScamWarningDescription.message
          .replace('$1', 'FAKE')
          .replace('$2', 'ETH'),
      ),
    ).toBeInTheDocument();
  });

  it('falls back to a generic expected symbol when the chain is unknown', () => {
    const { getByText } = renderModal();

    expect(
      getByText(
        messages.nativeTokenScamWarningDescription.message
          .replace('$1', 'FAKE')
          .replace(
            '$2',
            messages.nativeTokenScamWarningDescriptionExpectedTokenFallback
              .message,
          ),
      ),
    ).toBeInTheDocument();
  });

  it('edits the network and navigates to the networks route when the button is clicked', () => {
    const { getByText, store } = renderModal({ chains: safeChains });

    fireEvent.click(
      getByText(messages.nativeTokenScamWarningConversion.message),
    );

    expect(store.getActions()).toStrictEqual([
      { type: 'SET_EDIT_NETWORK', payload: { chainId: '0x1' } },
    ]);
    expect(mockUseNavigate).toHaveBeenCalledWith(NETWORKS_ROUTE);
  });

  it('calls onClose when the header close button is clicked', () => {
    const { getByLabelText, onClose } = renderModal();

    fireEvent.click(getByLabelText(messages.close.message));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
