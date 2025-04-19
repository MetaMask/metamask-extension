import React from 'react';

import configureStore from '../../../../../../store/store';
import {
  downgradeAccountConfirmation,
  upgradeAccountConfirmation,
} from '../../../../../../../test/data/confirmations/batch-transaction';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import { Confirmation } from '../../../../types/confirm';
import SmartAccountSwitchInfo from './smart-account-switch-info';

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackInlineAlertClicked: jest.fn(),
      trackAlertRender: jest.fn(),
      trackAlertActionClicked: jest.fn(),
    })),
  }),
);

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue({
    lowerTimeBound: 0,
    upperTimeBound: 60000,
  }),
}));

function render(confirmation: Confirmation) {
  const store = configureStore(getMockConfirmStateForTransaction(confirmation));
  return renderWithConfirmContextProvider(<SmartAccountSwitchInfo />, store);
}

describe('SmartAccountSwitchInfo', () => {
  it('renders correctly for upgrade request', () => {
    const { getByText } = render(upgradeAccountConfirmation as Confirmation);
    expect(getByText('0x8a0bb...bDB87')).toBeInTheDocument();
    expect(getByText('Standard account')).toBeInTheDocument();
    expect(getByText('Interacting with')).toBeInTheDocument();
    expect(getByText('Smart contract')).toBeInTheDocument();
    expect(getByText('Network fee')).toBeInTheDocument();
    expect(getByText('ETH')).toBeInTheDocument();
  });

  it('renders required data for revoke request', () => {
    const { getByText } = render(downgradeAccountConfirmation as Confirmation);
    expect(getByText('0x8a0bb...bDB87')).toBeInTheDocument();
    expect(getByText('Standard account')).toBeInTheDocument();
    expect(getByText('Network fee')).toBeInTheDocument();
    expect(getByText('ETH')).toBeInTheDocument();
  });
});
