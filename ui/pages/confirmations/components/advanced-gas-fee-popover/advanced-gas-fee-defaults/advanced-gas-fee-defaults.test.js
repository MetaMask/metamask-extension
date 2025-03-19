import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';

import {
  EditGasModes,
  GasEstimateTypes,
} from '../../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import mockEstimates from '../../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../../test/data/mock-state.json';
import * as Actions from '../../../../../store/actions';

import { AdvancedGasFeePopoverContextProvider } from '../context';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';
import configureStore from '../../../../../store/store';

import AdvancedGasFeeInputs from '../advanced-gas-fee-inputs';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { getSelectedInternalAccountFromMockState } from '../../../../../../test/jest/mocks';
import { mockNetworkState } from '../../../../../../test/stub/networks';
import AdvancedGasFeeDefaults from './advanced-gas-fee-defaults';

const TEXT_SELECTOR = 'Save these values as my default for the Goerli network.';
const CHAIN_ID_MOCK = CHAIN_IDS.GOERLI;

jest.mock('../../../../../store/actions', () => ({
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x5' }),
  setAdvancedGasFee: jest.fn(),
  updateEventFragment: jest.fn(),
  createTransactionEventFragment: jest.fn(),
}));

const mockSelectedInternalAccount =
  getSelectedInternalAccountFromMockState(mockState);

const render = async (defaultGasParams, contextParams) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      ...defaultGasParams,
      ...mockNetworkState({ chainId: CHAIN_ID_MOCK }),
      accounts: {
        [mockSelectedInternalAccount.address]: {
          address: mockSelectedInternalAccount.address,
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

  let result;

  await act(
    async () =>
      (result = renderWithProvider(
        <GasFeeContextProvider
          transaction={{
            chainId: CHAIN_ID_MOCK,
            userFeeLevel: 'medium',
          }}
          {...contextParams}
        >
          <AdvancedGasFeePopoverContextProvider>
            <AdvancedGasFeeInputs />
            <AdvancedGasFeeDefaults />
          </AdvancedGasFeePopoverContextProvider>
        </GasFeeContextProvider>,
        store,
      )),
  );

  return result;
};

describe('AdvancedGasFeeDefaults', () => {
  it('should renders correct message when the default is not set', async () => {
    await render({ advancedGasFee: {} });
    expect(screen.queryByText(TEXT_SELECTOR)).toBeInTheDocument();
  });
  it('should renders correct message when the default values are set', async () => {
    await render({
      advancedGasFee: {
        [CHAIN_IDS.GOERLI]: { maxBaseFee: '50', priorityFee: '2' },
      },
    });
    expect(screen.queryByText(TEXT_SELECTOR)).toBeInTheDocument();
  });
  it('should renders correct message when the default values are set and the maxBaseFee values are updated', async () => {
    await render({
      advancedGasFee: {
        [CHAIN_IDS.GOERLI]: { maxBaseFee: '50', priorityFee: '2' },
      },
    });
    expect(document.getElementsByTagName('input')[2]).toBeChecked();
    expect(screen.queryByText(TEXT_SELECTOR)).toBeInTheDocument();
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 75 },
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(75);
    expect(screen.queryByText(TEXT_SELECTOR)).toBeInTheDocument();
    expect(screen.queryByText(TEXT_SELECTOR)).toBeInTheDocument();
  });
  it('should renders correct message when the default values are set and the priorityFee values are updated', async () => {
    await render({
      advancedGasFee: {
        [CHAIN_IDS.GOERLI]: { maxBaseFee: '50', priorityFee: '2' },
      },
    });
    expect(document.getElementsByTagName('input')[2]).toBeChecked();
    expect(screen.queryByText(TEXT_SELECTOR)).toBeInTheDocument();
    fireEvent.change(document.getElementsByTagName('input')[1], {
      target: { value: 5 },
    });
    expect(document.getElementsByTagName('input')[1]).toHaveValue(5);
    expect(screen.queryByText(TEXT_SELECTOR)).toBeInTheDocument();
    expect(screen.queryByText(TEXT_SELECTOR)).toBeInTheDocument();
  });

  it('should call action setAdvancedGasFee when checkbox or label text is clicked', async () => {
    await render({
      advancedGasFee: {
        [CHAIN_IDS.GOERLI]: { maxBaseFee: 50, priorityFee: 2 },
      },
    });
    const mock = jest
      .spyOn(Actions, 'setAdvancedGasFee')
      .mockReturnValue({ type: 'test' });
    const checkboxLabel = screen.queryByText(TEXT_SELECTOR);
    fireEvent.click(checkboxLabel);
    expect(mock).toHaveBeenCalledTimes(1);
    const checkbox = document.querySelector('input[type=checkbox]');
    fireEvent.click(checkbox);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it('should not render option to set default gas options in a swaps transaction', async () => {
    await render({}, { editGasMode: EditGasModes.swaps });
    expect(
      document.querySelector('input[type=checkbox]'),
    ).not.toBeInTheDocument();
  });
});
