import React from 'react';
import { waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';

import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockSendState from '../../../../test/data/mock-send-state.json';
import {
  NETWORK_TYPES,
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
} from '../../../../shared/constants/network';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import SendContent from '.';

jest.mock('../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn().mockResolvedValue(),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
  createTransactionEventFragment: jest.fn(),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue('unknown'),
  getTokenSymbol: jest.fn().mockResolvedValue('ETH'),
}));

jest.mock('../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

describe('SendContent Component', () => {
  useIsOriginalNativeTokenSymbol.mockReturnValue(true);
  describe('render', () => {
    const mockStore = configureMockStore()({
      ...mockSendState,
      metamask: {
        ...mockSendState.metamask,
        providerConfig: {
          chainId: CHAIN_IDS.GOERLI,
          nickname: GOERLI_DISPLAY_NAME,
          type: NETWORK_TYPES.GOERLI,
        },
      },
    });

    it('should match snapshot', async () => {
      const props = {
        gasIsExcessive: false,
        showHexData: true,
      };

      const { container } = renderWithProvider(
        <SendContent {...props} />,
        mockStore,
      );

      await waitFor(() => {
        expect(container).toMatchSnapshot();
      });
    });
  });

  describe('SendHexDataRow', () => {
    const tokenAssetState = {
      ...mockSendState,
      send: {
        ...mockSendState.send,
        draftTransactions: {
          '1-tx': {
            ...mockSendState.send.draftTransactions['1-tx'],
            asset: {
              balance: '0x3635c9adc5dea00000',
              details: {
                address: '0xAddress',
                decimals: 18,
                symbol: 'TST',
                balance: '1',
                standard: 'ERC20',
              },
              error: null,
              type: 'TOKEN',
            },
          },
        },
      },
      metamask: {
        ...mockSendState.metamask,
        providerConfig: {
          chainId: CHAIN_IDS.GOERLI,
          nickname: GOERLI_DISPLAY_NAME,
          type: NETWORK_TYPES.GOERLI,
        },
      },
    };

    it('should not render the SendHexDataRow if props.showHexData is false', async () => {
      const props = {
        gasIsExcessive: false,
        showHexData: false,
      };

      const mockStore = configureMockStore()({
        ...mockSendState,
        metamask: {
          ...mockSendState.metamask,
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      });

      const { queryByText } = renderWithProvider(
        <SendContent {...props} />,
        mockStore,
      );

      await waitFor(() => {
        expect(queryByText('Hex data:')).not.toBeInTheDocument();
      });
    });

    it('should not render the SendHexDataRow if the asset type is TOKEN (ERC-20)', async () => {
      const props = {
        gasIsExcessive: false,
        showHexData: true,
      };

      // Use token draft transaction asset
      const mockState = configureMockStore()(tokenAssetState);

      const { queryByText } = renderWithProvider(
        <SendContent {...props} />,
        mockState,
      );

      await waitFor(() => {
        expect(queryByText('Hex data:')).not.toBeInTheDocument();
      });
    });
  });

  describe('Gas Error', () => {
    it('should show gas warning when gasIsExcessive prop is true.', async () => {
      const props = {
        gasIsExcessive: true,
        showHexData: false,
      };

      const mockStore = configureMockStore()({
        ...mockSendState,
        metamask: {
          ...mockSendState.metamask,
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      });

      const { queryByTestId } = renderWithProvider(
        <SendContent {...props} />,
        mockStore,
      );

      const gasWarning = queryByTestId('gas-warning-message');

      await waitFor(() => {
        expect(gasWarning).toBeInTheDocument();
      });
    });

    it('should show gas warning for none gasEstimateType in state', async () => {
      const props = {
        gasIsExcessive: false,
        showHexData: false,
      };

      const noGasPriceState = {
        ...mockSendState,
        metamask: {
          ...mockSendState.metamask,
          gasEstimateType: 'none',
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      };

      const mockStore = configureMockStore()(noGasPriceState);

      const { queryByTestId } = renderWithProvider(
        <SendContent {...props} />,
        mockStore,
      );

      const gasWarning = queryByTestId('gas-warning-message');

      await waitFor(() => {
        expect(gasWarning).toBeInTheDocument();
      });
    });
  });

  describe('Recipient Warning', () => {
    it('should show recipient warning with knownAddressRecipient state in draft transaction state', async () => {
      const props = {
        gasIsExcessive: false,
        showHexData: false,
      };

      const knownRecipientWarningState = {
        ...mockSendState,
        send: {
          ...mockSendState.send,
          draftTransactions: {
            '1-tx': {
              ...mockSendState.send.draftTransactions['1-tx'],
              recipient: {
                ...mockSendState.send.draftTransactions['1-tx'].recipient,
                warning: 'knownAddressRecipient',
              },
            },
          },
        },
        metamask: {
          ...mockSendState.metamask,
          gasEstimateType: 'none',
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      };

      const mockStore = configureMockStore()(knownRecipientWarningState);

      const { queryByTestId } = renderWithProvider(
        <SendContent {...props} />,
        mockStore,
      );

      const sendWarning = queryByTestId('send-warning');

      await waitFor(() => {
        expect(sendWarning).toBeInTheDocument();
      });
    });
  });

  describe('Assert Error', () => {
    it('should render dialog error with asset error in draft transaction state', async () => {
      const props = {
        gasIsExcessive: false,
        showHexData: false,
      };

      const assertErrorState = {
        ...mockSendState,
        send: {
          ...mockSendState.send,
          draftTransactions: {
            '1-tx': {
              ...mockSendState.send.draftTransactions['1-tx'],
              asset: {
                ...mockSendState.send.draftTransactions['1-tx'].asset,
                error: 'transactionError',
              },
            },
          },
        },
        metamask: {
          ...mockSendState.metamask,
          gasEstimateType: 'none',
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      };

      const mockStore = configureMockStore()(assertErrorState);

      const { queryByTestId } = renderWithProvider(
        <SendContent {...props} />,
        mockStore,
      );

      const dialogMessage = queryByTestId('dialog-message');

      await waitFor(() => {
        expect(dialogMessage).toBeInTheDocument();
      });
    });
  });

  describe('Warning', () => {
    it('should display warning dialog message from warning prop', async () => {
      const props = {
        gasIsExcessive: false,
        showHexData: false,
        warning: 'warning',
      };

      const mockStore = configureMockStore()({
        ...mockSendState,
        metamask: {
          ...mockSendState.metamask,
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      });

      const { queryByTestId } = renderWithProvider(
        <SendContent {...props} />,
        mockStore,
      );

      const dialogMessage = queryByTestId('dialog-message');

      await waitFor(() => {
        expect(dialogMessage).toBeInTheDocument();
      });
    });
  });
});
