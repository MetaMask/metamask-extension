import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import React from 'react';
import { CHAIN_IDS } from '@metamask/transaction-controller';

import {
  getMockConfirmStateForTransaction,
  getMockContractInteractionConfirmState,
} from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../../../helpers/constants/design-system';
import { NetworkRow } from './network-row';

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

describe('NetworkRow', () => {
  const middleware = [thunk];

  it('does display network information of current confirmation', () => {
    const state = getMockContractInteractionConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    const { getByText } = renderWithConfirmContextProvider(
      <NetworkRow />,
      mockStore,
    );
    expect(getByText('Network')).toBeInTheDocument();
    expect(getByText('Goerli')).toBeInTheDocument();
  });

  it('does not display network if isShownWithAlertsOnly is true and there is no field alert', () => {
    const state = getMockContractInteractionConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    const { queryByText } = renderWithConfirmContextProvider(
      <NetworkRow isShownWithAlertsOnly />,
      mockStore,
    );
    expect(queryByText('Network')).not.toBeInTheDocument();
  });

  it('does display network if isShownWithAlertsOnly is true and field alert is present', () => {
    const contractInteraction = genUnapprovedContractInteractionConfirmation({
      chainId: CHAIN_IDS.GOERLI,
    });
    const state = {
      ...getMockConfirmStateForTransaction(contractInteraction),
      confirmAlerts: {
        alerts: {
          [contractInteraction.id]: [
            {
              key: 'networkSwitchInfo',
              field: RowAlertKey.Network,
              severity: Severity.Info,
              message: 'dummy message',
              reason: 'dummy reason',
            },
          ],
        },
        confirmed: {},
      },
    };

    const mockStore = configureMockStore(middleware)(state);
    const { getByText } = renderWithConfirmContextProvider(
      <NetworkRow isShownWithAlertsOnly />,
      mockStore,
    );
    expect(getByText('Network')).toBeInTheDocument();
    expect(getByText('Goerli')).toBeInTheDocument();
  });
});
