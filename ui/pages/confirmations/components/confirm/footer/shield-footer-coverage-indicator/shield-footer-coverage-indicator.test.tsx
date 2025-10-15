import React from 'react';
import configureMockStore from 'redux-mock-store';

import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { tEn } from '../../../../../../../test/lib/i18n-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import ShieldFooterCoverageIndicator from './shield-footer-coverage-indicator';

jest.mock(
  '../../../../hooks/transactions/useEnableShieldCoverageChecks',
  () => ({
    useEnableShieldCoverageChecks: jest.fn(() => true),
  }),
);

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

describe('ShieldFooterCoverageIndicator', () => {
  it('renders transaction shield label when coverage indicator is enabled', () => {
    const transaction = genUnapprovedContractInteractionConfirmation();
    const state = getMockConfirmStateForTransaction(transaction);
    const store = configureMockStore([])(state);

    const { getByText } = renderWithConfirmContextProvider(
      <ShieldFooterCoverageIndicator />,
      store,
    );

    expect(getByText(tEn('transactionShield') as string)).toBeInTheDocument();
  });
});
