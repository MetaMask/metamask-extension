import React from 'react';
import { act, screen } from '@testing-library/react';
import BigNumber from 'bignumber.js';

import {
  EditGasModes,
  GasEstimateTypes,
} from '../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockEstimates from '../../../../test/data/mock-estimates.json';
import mockState from '../../../../test/data/mock-state.json';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import configureStore from '../../../store/store';
import InfoTooltip from '../../ui/info-tooltip';
import {
  decGWEIToHexWEI,
  hexWEIToDecETH,
} from '../../../../shared/modules/conversion.utils';
import CancelSpeedupPopover from './cancel-speedup-popover';

const MAXFEEPERGAS_ABOVE_MOCK_MEDIUM_HEX = '0x174876e800';
const MAXGASCOST_ABOVE_MOCK_MEDIUM_BN = new BigNumber(
  MAXFEEPERGAS_ABOVE_MOCK_MEDIUM_HEX,
  16,
).times(21000, 10);
const MAXGASCOST_ABOVE_MOCK_MEDIUM_BN_PLUS_TEN_PCT_HEX =
  MAXGASCOST_ABOVE_MOCK_MEDIUM_BN.times(1.1, 10).toString(16);

const EXPECTED_ETH_FEE_1 = hexWEIToDecETH(
  MAXGASCOST_ABOVE_MOCK_MEDIUM_BN_PLUS_TEN_PCT_HEX,
);

const MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_DEC_GWEI =
  mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates.medium
    .suggestedMaxFeePerGas;
const MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_BN_WEI = new BigNumber(
  decGWEIToHexWEI(MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_DEC_GWEI),
  16,
);
const MAXFEEPERGAS_BELOW_MOCK_MEDIUM_HEX =
  MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_BN_WEI.div(10, 10).toString(16);

const EXPECTED_ETH_FEE_2 = hexWEIToDecETH(
  MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_BN_WEI.times(21000, 10).toString(16),
);

const MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_HEX_WEI =
  MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_BN_WEI.toString(16);

jest.mock('../../../store/actions', () => ({
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest.fn().mockImplementation(() =>
    Promise.resolve({
      chainId: '0x5',
    }),
  ),
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
  updateTransactionGasFees: () => ({ type: 'UPDATE_TRANSACTION_PARAMS' }),
  updatePreviousGasParams: () => ({ type: 'UPDATE_TRANSACTION_PARAMS' }),
  createTransactionEventFragment: jest.fn(),
}));

jest.mock('../../../contexts/transaction-modal', () => ({
  useTransactionModalContext: () => ({
    closeModal: () => undefined,
    currentModal: 'cancelSpeedUpTransaction',
  }),
}));

jest.mock('../../ui/info-tooltip', () => jest.fn(() => null));

const render = (
  props,
  maxFeePerGas = MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_HEX_WEI,
) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      accounts: {
        [mockState.metamask.selectedAddress]: {
          address: mockState.metamask.selectedAddress,
          balance: '0x1F4',
        },
      },
      featureFlags: { advancedInlineGas: true },
      gasFeeEstimates:
        mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates,
      gasFeeEstimatesByChainId: {
        ...mockState.metamask.gasFeeEstimatesByChainId,
        '0x5': {
          ...mockState.metamask.gasFeeEstimatesByChainId['0x5'],
          gasFeeEstimates:
            mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates,
        },
      },
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider
      transaction={{
        userFeeLevel: 'tenPercentIncreased',
        txParams: {
          gas: '0x5208',
          maxFeePerGas,
          maxPriorityFeePerGas: '0x59682f00',
        },
      }}
      editGasMode={EditGasModes.cancel}
      {...props}
    >
      <CancelSpeedupPopover />
    </GasFeeContextProvider>,
    store,
  );
};

describe('CancelSpeedupPopover', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have ❌Cancel in header if editGasMode is cancel', async () => {
    await act(async () => render());
    expect(screen.queryByText('❌Cancel')).toBeInTheDocument();
  });

  it('should have 🚀Speed up in header if editGasMode is speedup', async () => {
    await act(async () => render({ editGasMode: EditGasModes.speedUp }));
    expect(screen.queryByText('🚀Speed up')).toBeInTheDocument();
  });

  it('information tooltip should contain the correct text if editGasMode is cancel', async () => {
    await act(async () => render());
    expect(
      InfoTooltip.mock.calls[0][0].contentText.props.children[0].props.children,
    ).toStrictEqual(
      'To Cancel a transaction the gas fee must be increased by at least 10% for it to be recognized by the network.',
    );
  });

  it('information tooltip should contain the correct text if editGasMode is speedup', async () => {
    await act(async () => render({ editGasMode: EditGasModes.speedUp }));
    expect(
      InfoTooltip.mock.calls[0][0].contentText.props.children[0].props.children,
    ).toStrictEqual(
      'To Speed up a transaction the gas fee must be increased by at least 10% for it to be recognized by the network.',
    );
  });

  it('should show correct gas values, increased by 10%, when initial initial gas value is above estimated medium', async () => {
    await act(async () =>
      render(
        {
          editGasMode: EditGasModes.speedUp,
        },
        MAXFEEPERGAS_ABOVE_MOCK_MEDIUM_HEX,
      ),
    );
    expect(
      screen.queryAllByTitle(`${EXPECTED_ETH_FEE_1} ETH`).length,
    ).toBeGreaterThan(0);
  });

  it('should show correct gas values, set to the estimated medium, when initial initial gas value is below estimated medium', async () => {
    await act(async () =>
      render(
        {
          editGasMode: EditGasModes.speedUp,
        },
        `0x${MAXFEEPERGAS_BELOW_MOCK_MEDIUM_HEX}`,
      ),
    );

    expect(
      screen.queryAllByTitle(`${EXPECTED_ETH_FEE_2} ETH`).length,
    ).toBeGreaterThan(0);
  });
});
