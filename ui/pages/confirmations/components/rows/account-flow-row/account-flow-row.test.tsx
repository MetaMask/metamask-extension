import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockTokenTransferConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { TrustSignalDisplayState } from '../../../../../hooks/useTrustSignals';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { AccountFlowRow } from './account-flow-row';

jest.mock(
  '../../../../../components/app/alert-system/contexts/alertMetricsContext.tsx',
  () => ({
    useAlertMetrics: () => ({
      trackInlineAlertClicked: jest.fn(),
      trackAlertRender: jest.fn(),
      trackAlertActionClicked: jest.fn(),
    }),
  }),
);

const label = messages.from.message;

const ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

const defaultProps = {
  address: ADDRESS,
  label,
  alertKey: RowAlertKey.SigningInWith,
  name: null,
  isAccount: false,
  displayState: TrustSignalDisplayState.Unknown,
  'data-testid': 'test-address',
};

describe('<AccountFlowRow />', () => {
  it('renders the address display', () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { getByTestId } = renderWithConfirmContextProvider(
      <AccountFlowRow {...defaultProps} />,
      mockStore,
    );
    expect(getByTestId('test-address')).toBeInTheDocument();
  });

  it('renders the label', () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <AccountFlowRow {...defaultProps} />,
      mockStore,
    );
    expect(getByText(label)).toBeInTheDocument();
  });
});
