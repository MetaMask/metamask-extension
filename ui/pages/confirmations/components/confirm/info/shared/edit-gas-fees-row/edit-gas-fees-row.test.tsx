import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { getMockContractInteractionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { EditGasFeesRow } from './edit-gas-fees-row';

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

describe('<EditGasFeesRow />', () => {
  const middleware = [thunk];

  it('renders component', () => {
    const state = getMockContractInteractionConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <EditGasFeesRow
        fiatFee="$1"
        nativeFee="0.001 ETH"
        fiatFeeWith18SignificantDigits="0.001234"
        supportsEIP1559={true}
        setShowCustomizeGasPopover={() => console.log('open popover')}
      />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
