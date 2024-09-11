import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  getMockContractInteractionConfirmState,
  getMockPersonalSignConfirmState,
  getMockPersonalSignConfirmStateForRequest,
  getMockTypedSignConfirmState,
  getMockTypedSignConfirmStateForRequest,
} from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { permitSignatureMsg } from '../../../../../../test/data/confirmations/typed_sign';
import { unapprovedPersonalSignMsg } from '../../../../../../test/data/confirmations/personal_sign';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  Alert,
  ConfirmAlertsState,
} from '../../../../../ducks/confirm-alerts/confirm-alerts';
import ConfirmTitle from './title';

describe('ConfirmTitle', () => {
  it('should render the title and description for a personal signature', () => {
    const mockStore = configureMockStore([])(getMockPersonalSignConfirmState);
    const { getByText } = renderWithConfirmContextProvider(
      <ConfirmTitle />,
      mockStore,
    );

    expect(getByText('Signature request')).toBeInTheDocument();
    expect(
      getByText(
        'Only confirm this message if you approve the content and trust the requesting site.',
      ),
    ).toBeInTheDocument();
  });

  it('should render the title and description for a permit signature', () => {
    const mockStore = configureMockStore([])(
      getMockTypedSignConfirmStateForRequest(permitSignatureMsg),
    );
    const { getByText } = renderWithConfirmContextProvider(
      <ConfirmTitle />,
      mockStore,
    );

    expect(getByText('Spending cap request')).toBeInTheDocument();
    expect(
      getByText('This site wants permission to spend your tokens.'),
    ).toBeInTheDocument();
  });

  it('should render the title and description for typed signature', () => {
    const mockStore = configureMockStore([])(getMockTypedSignConfirmState());
    const { getByText } = renderWithConfirmContextProvider(
      <ConfirmTitle />,
      mockStore,
    );

    expect(getByText('Signature request')).toBeInTheDocument();
    expect(
      getByText(
        'Only confirm this message if you approve the content and trust the requesting site.',
      ),
    ).toBeInTheDocument();
  });

  it('should render the title and description for a contract interaction transaction', () => {
    const mockStore = configureMockStore([])(
      getMockContractInteractionConfirmState(),
    );
    const { getByText } = renderWithConfirmContextProvider(
      <ConfirmTitle />,
      mockStore,
    );

    expect(getByText('Transaction request')).toBeInTheDocument();
  });

  describe('Alert banner', () => {
    const alertMock = {
      severity: Severity.Danger,
      message: 'mock message',
      reason: 'mock reason',
      key: 'mock key',
    };
    const mockAlertState = (state: Partial<ConfirmAlertsState> = {}) =>
      getMockPersonalSignConfirmStateForRequest(unapprovedPersonalSignMsg, {
        metamask: {},
        confirmAlerts: {
          alerts: {
            [unapprovedPersonalSignMsg.id]: [alertMock, alertMock, alertMock],
          },
          confirmed: {
            [unapprovedPersonalSignMsg.id]: {
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
            [unapprovedPersonalSignMsg.id]: [alertMock as Alert],
          },
        }),
      );
      const { queryByText } = renderWithConfirmContextProvider(
        <ConfirmTitle />,
        mockStore,
      );

      expect(queryByText(alertMock.reason)).toBeInTheDocument();
      expect(queryByText(alertMock.message)).toBeInTheDocument();
    });

    it('renders alert banner when there are multiple alerts', () => {
      const mockStore = configureMockStore([])(mockAlertState());

      const { getByText } = renderWithConfirmContextProvider(
        <ConfirmTitle />,
        mockStore,
      );

      expect(getByText('Multiple alerts!')).toBeInTheDocument();
    });
  });
});
