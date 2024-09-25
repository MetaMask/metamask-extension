import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
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

describe('<EditGasFeesRow />', () => {
  const middleware = [thunk];

  it('renders component', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: genUnapprovedContractInteractionConfirmation(),
      },
    };
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(
      <EditGasFeesRow
        fiatFee="$1"
        nativeFee="0.001 ETH"
        supportsEIP1559={true}
        setShowCustomizeGasPopover={() => console.log('open popover')}
      />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
