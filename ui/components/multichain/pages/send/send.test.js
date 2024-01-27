import React from 'react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider, waitFor } from '../../../../../test/jest';
import { AssetType } from '../../../../../shared/constants/transaction';
import {
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import { useIsOriginalNativeTokenSymbol } from '../../../../hooks/useIsOriginalNativeTokenSymbol';
import { SendPage } from '.';

jest.mock('@ethersproject/providers', () => {
  const originalModule = jest.requireActual('@ethersproject/providers');
  return {
    ...originalModule,
    Web3Provider: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

jest.mock('../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn().mockResolvedValue(),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
  createTransactionEventFragment: jest.fn(),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue('unknown'),
  getTokenSymbol: jest.fn().mockResolvedValue('ETH'),
}));

jest.mock('../../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

const render = (props = {}, state = {}) => {
  const store = configureStore({
    ...mockState,
    send: {
      ...mockState.send,
      currentTransactionUUID: 'uuid',
      draftTransactions: {
        uuid: {
          asset: { type: AssetType.native },
          amount: {},
        },
      },
    },
    ...state,
  });
  return renderWithProvider(<SendPage {...props} />, store);
};

describe('SendPage', () => {
  describe('render', () => {
    it('renders correctly', () => {
      const { container, getByTestId } = render();
      expect(container).toMatchSnapshot();
      expect(getByTestId('send-page-network-picker')).toBeInTheDocument();
    });
  });

  describe('Recipient Warning', () => {
    useIsOriginalNativeTokenSymbol.mockReturnValue(true);

    it('should show recipient warning with knownAddressRecipient state in draft transaction state', async () => {
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

      const { queryByTestId } = render({}, knownRecipientWarningState);

      const sendWarning = queryByTestId('send-warning');
      await waitFor(() => {
        expect(sendWarning).toBeInTheDocument();
      });
    });
  });
});
