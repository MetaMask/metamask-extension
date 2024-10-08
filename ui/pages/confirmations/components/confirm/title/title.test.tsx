import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionType } from '@metamask/transaction-controller';

import {
  permitSignatureMsg,
  unapprovedTypedSignMsgV4,
} from '../../../../../../test/data/confirmations/typed_sign';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { Confirmation } from '../../../types/confirm';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  Alert,
  ConfirmAlertsState,
} from '../../../../../ducks/confirm-alerts/confirm-alerts';
import ConfirmTitle from './title';

const genMockState = (confirmationOverride: Partial<Confirmation> = {}) => ({
  confirm: {
    currentConfirmation: {
      type: TransactionType.personalSign,
      ...confirmationOverride,
    },
  },
  confirmAlerts: {
    alerts: {},
    confirmed: {},
  },
});

describe('ConfirmTitle', () => {
  it('should render the title and description for a personal signature', () => {
    const mockStore = configureMockStore([])(
      genMockState({ type: TransactionType.personalSign }),
    );
    const { getByText } = renderWithProvider(<ConfirmTitle />, mockStore);

    expect(getByText('Signature request')).toBeInTheDocument();
    expect(
      getByText(
        'Only confirm this message if you approve the content and trust the requesting site.',
      ),
    ).toBeInTheDocument();
  });

  it('should render the title and description for a permit signature', () => {
    const mockStore = configureMockStore([])(
      genMockState(permitSignatureMsg as Confirmation),
    );
    const { getByText } = renderWithProvider(<ConfirmTitle />, mockStore);

    expect(getByText('Spending cap request')).toBeInTheDocument();
    expect(
      getByText('This site wants permission to spend your tokens.'),
    ).toBeInTheDocument();
  });

  it('should render the title and description for typed signature', () => {
    const mockStore = configureMockStore([])(
      genMockState(unapprovedTypedSignMsgV4 as Confirmation),
    );
    const { getByText } = renderWithProvider(<ConfirmTitle />, mockStore);

    expect(getByText('Signature request')).toBeInTheDocument();
    expect(
      getByText(
        'Only confirm this message if you approve the content and trust the requesting site.',
      ),
    ).toBeInTheDocument();
  });

  it('should render the title and description for a contract interaction transaction', () => {
    const mockStore = configureMockStore([])(
      genMockState({ type: TransactionType.contractInteraction }),
    );
    const { getByText } = renderWithProvider(<ConfirmTitle />, mockStore);

    expect(getByText('Transaction request')).toBeInTheDocument();
  });

  describe('Alert banner', () => {
    const CONFIRMATION_ID_MOCK = '123';
    const alertMock = {
      severity: Severity.Danger,
      message: 'mock message',
      reason: 'mock reason',
      key: 'mock key',
    };
    const mockAlertState = (state: Partial<ConfirmAlertsState> = {}) => ({
      confirm: {
        currentConfirmation: {
          type: TransactionType.personalSign,
          id: CONFIRMATION_ID_MOCK,
        },
      },
      confirmAlerts: {
        alerts: {
          [CONFIRMATION_ID_MOCK]: [alertMock, alertMock, alertMock],
        },
        confirmed: {
          [CONFIRMATION_ID_MOCK]: {
            [alertMock.key]: false,
          },
        },
        ...state,
      },
    });
    it('renders an alert banner if there is a danger alert', () => {
      const mockStore = configureMockStore([])(
        mockAlertState({
          alerts: {
            [CONFIRMATION_ID_MOCK]: [alertMock as Alert],
          },
        }),
      );
      const { queryByText } = renderWithProvider(<ConfirmTitle />, mockStore);

      expect(queryByText(alertMock.reason)).toBeInTheDocument();
      expect(queryByText(alertMock.message)).toBeInTheDocument();
    });

    it('renders alert banner when there are multiple alerts', () => {
      const mockStore = configureMockStore([])(mockAlertState());

      const { getByText } = renderWithProvider(<ConfirmTitle />, mockStore);

      expect(getByText('Multiple alerts!')).toBeInTheDocument();
    });
  });
});
