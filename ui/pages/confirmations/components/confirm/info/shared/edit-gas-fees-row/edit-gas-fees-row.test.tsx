import React from 'react';
import configureMockStore from 'redux-mock-store';

import { CHAIN_IDS, GasFeeToken } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { GAS_FEE_TOKEN_MOCK } from '../../../../../../../../test/data/confirmations/gas';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { EditGasFeesRow } from './edit-gas-fees-row';

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

function render({
  gasFeeTokens,
  selectedGasFeeToken,
}: { gasFeeTokens?: GasFeeToken[]; selectedGasFeeToken?: Hex } = {}) {
  const state = getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      chainId: CHAIN_IDS.GOERLI,
      gasFeeTokens,
      selectedGasFeeToken,
    }),
  );

  const mockStore = configureMockStore()(state);

  return renderWithConfirmContextProvider(
    <EditGasFeesRow
      fiatFee="$1"
      nativeFee="0.001 ETH"
      fiatFeeWith18SignificantDigits="0.001234"
      supportsEIP1559={true}
      setShowCustomizeGasPopover={() => console.log('open popover')}
    />,
    mockStore,
  );
}

describe('<EditGasFeesRow />', () => {
  it('renders component', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('renders metamask fee if gas fee token selected', () => {
    const { getByTestId } = render({
      gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
      selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
    });

    expect(getByTestId('gas-fee-token-fee')).toBeInTheDocument();
  });
});
