import { waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { enLocale as messages } from '../../../../../../../../test/lib/i18n-helpers';
import {
  genUnapprovedApproveConfirmation,
  genUnapprovedPermit2ApproveConfirmation,
} from '../../../../../../../../test/data/confirmations/token-approve';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../../../helpers/constants/design-system';
import { ApproveDetails } from './approve-details';

jest.mock('../../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../../store/actions'),
  getTokenStandardAndDetailsByChain: jest.fn(),
}));

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext.tsx',
  () => ({
    useAlertMetrics: () => ({
      trackInlineAlertClicked: jest.fn(),
      trackAlertRender: jest.fn(),
      trackAlertActionClicked: jest.fn(),
    }),
  }),
);

describe('<ApproveDetails />', () => {
  const middleware = [thunk];

  it('renders component for approve details', () => {
    const state = getMockConfirmStateForTransaction(
      genUnapprovedApproveConfirmation(),
    );
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <ApproveDetails />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders component for approve details for setApprovalForAll', () => {
    const state = getMockConfirmStateForTransaction(
      genUnapprovedApproveConfirmation(),
    );
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <ApproveDetails isSetApprovalForAll />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('display network info if there is an alert on that field', () => {
    const approveConfirmation = genUnapprovedApproveConfirmation();
    const state = {
      ...getMockConfirmStateForTransaction(approveConfirmation),
      confirmAlerts: {
        alerts: {
          [approveConfirmation.id]: [
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
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <ApproveDetails />,
      mockStore,
    );
    expect(getByText(messages.network.message)).toBeInTheDocument();
    expect(getByText(messages.networkNameGoerli.message)).toBeInTheDocument();
  });

  describe('Permit2', () => {
    function renderPermit2Details(expiration: number) {
      const state = getMockConfirmStateForTransaction(
        genUnapprovedPermit2ApproveConfirmation({ expiration }),
      );
      return renderWithConfirmContextProvider(
        <ApproveDetails />,
        configureMockStore(middleware)(state),
      );
    }

    it('shows the spender and the expiration date', async () => {
      const { getByTestId } = renderPermit2Details(1767225600);

      await waitFor(() => {
        expect(getByTestId('confirmation__approve-spender')).toHaveTextContent(
          '0x22222...22222',
        );
      });
      expect(getByTestId('confirmation__approve-expiration')).toHaveTextContent(
        `${messages.confirmFieldExpiration.message}01 January 2026, 00:00`,
      );
    });

    it('shows never expires when the expiration is too large for a date', async () => {
      const { getByTestId } = renderPermit2Details(281474976710655);

      await waitFor(() => {
        expect(
          getByTestId('confirmation__approve-expiration'),
        ).toHaveTextContent(messages.confirmFieldNeverExpires.message);
      });
    });

    it('shows the current time when the expiration is 0', async () => {
      jest
        .spyOn(Date, 'now')
        .mockReturnValue(new Date('2026-11-10T12:30:00Z').getTime());

      const { getByTestId } = renderPermit2Details(0);

      await waitFor(() => {
        expect(
          getByTestId('confirmation__approve-expiration'),
        ).toHaveTextContent('10 November 2026, 12:30');
      });
    });
  });
});
