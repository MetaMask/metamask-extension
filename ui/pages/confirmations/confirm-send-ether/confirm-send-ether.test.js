import React from 'react';

import { act } from 'react-dom/test-utils';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { setBackgroundConnection } from '../../../store/background-connection';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import ConfirmSendEther from './confirm-send-ether';

jest.mock('../components/simulation-details/useSimulationMetrics');

setBackgroundConnection({
  gasFeeStartPolling: jest.fn().mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest.fn().mockImplementation(() =>
    Promise.resolve({
      chainId: '0x5',
    }),
  ),
  getGasFeeTimeEstimate: jest.fn(),
  promisifiedBackground: jest.fn(),
  tryReverseResolveAddress: jest.fn(),
  getNextNonce: jest.fn(),
  addKnownMethodData: jest.fn(),
  getLastInteractedConfirmationInfo: jest.fn(),
});

const sendEther = {
  id: 9597986287241458,
  time: 1681203297082,
  status: 'unapproved',
  originalGasEstimate: '0x5208',
  userEditedGasLimit: false,
  chainId: '0x5',
  loadingDefaults: false,
  gasLimitNoBuffer: '0x5208',
  dappSuggestedGasFees: {
    maxPriorityFeePerGas: '0x3b9aca00',
    maxFeePerGas: '0x2540be400',
  },
  sendFlowHistory: [],
  txParams: {
    from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    to: '0x0c54fccd2e384b4bb6f2e405bf5cbc15a017aafb',
    value: '0x0',
    gas: '0x5208',
    maxFeePerGas: '0x2540be400',
    maxPriorityFeePerGas: '0x3b9aca00',
  },
  origin: 'https://metamask.github.io',
  actionId: 1830698773,
  type: 'simpleSend',
  securityProviderResponse: null,
  userFeeLevel: 'dappSuggested',
  defaultGasEstimates: {
    estimateType: 'dappSuggested',
    gas: '0x5208',
    maxFeePerGas: '0x2540be400',
    maxPriorityFeePerGas: '0x3b9aca00',
  },
};

mockState.metamask.transactions.push(sendEther);

mockState.confirmTransaction = {
  txData: sendEther,
};

const store = configureStore(mockState);

describe('ConfirmSendEther', () => {
  it('should render correct information for for confirm send ether', async () => {
    const { getAllByTestId } = renderWithProvider(<ConfirmSendEther />, store);
    expect(getAllByTestId('page-container')).toMatchSnapshot();
    await act(async () => 0);
  });
});
