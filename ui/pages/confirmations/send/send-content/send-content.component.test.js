import React from 'react';
import { act, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';

import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import {
  NETWORK_TYPES,
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
} from '../../../../../shared/constants/network';
import { useIsOriginalNativeTokenSymbol } from '../../../../hooks/useIsOriginalNativeTokenSymbol';
import SendContent from '.';

jest.mock('../../../../store/actions', () => ({
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
  createTransactionEventFragment: jest.fn(),
  getTokenSymbol: jest.fn().mockResolvedValue('ETH'),
}));

jest.mock('../../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

const render = async (props, overrideStoreState) => {
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
    ...overrideStoreState,
  });

  let result;

  await act(
    async () =>
      (result = renderWithProvider(<SendContent {...props} />, mockStore)),
  );

  return result;
};

describe('SendContent Component', () => {
  beforeEach(() => {
    useIsOriginalNativeTokenSymbol.mockReturnValue(true);
  });

  describe('render', () => {
    it('should match snapshot', async () => {
      const { container } = await render({
        showHexData: true,
      });

      await waitFor(() => {
        expect(container).toMatchSnapshot();
      });
    });
  });

  describe('SendHexDataRow', () => {
    it('should not render the SendHexDataRow if props.showHexData is false', async () => {
      const { queryByText } = await render({
        showHexData: false,
      });

      await waitFor(() => {
        expect(queryByText('Hex data:')).not.toBeInTheDocument();
      });
    });

    it('should not render the SendHexDataRow if the asset type is TOKEN (ERC-20)', async () => {
      const tokenAssetState = {
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
      };

      const { queryByText } = await render(
        {
          showHexData: true,
        },
        tokenAssetState,
      );

      await waitFor(() => {
        expect(queryByText('Hex data:')).not.toBeInTheDocument();
      });
    });
  });

  describe('Recipient Warning', () => {
    it('should show recipient warning with knownAddressRecipient state in draft transaction state', async () => {
      const knownRecipientWarningState = {
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
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      };

      const { queryByTestId } = await render(
        {
          showHexData: false,
        },
        knownRecipientWarningState,
      );

      const sendWarning = queryByTestId('send-warning');

      await waitFor(() => {
        expect(sendWarning).toBeInTheDocument();
      });
    });
  });

  describe('Assert Error', () => {
    it('should render dialog error with asset error in draft transaction state', async () => {
      const assertErrorState = {
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
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      };

      const { queryByTestId } = await render(
        {
          showHexData: false,
        },
        assertErrorState,
      );

      const dialogMessage = queryByTestId('dialog-message');

      await waitFor(() => {
        expect(dialogMessage).toBeInTheDocument();
      });
    });
  });
});
