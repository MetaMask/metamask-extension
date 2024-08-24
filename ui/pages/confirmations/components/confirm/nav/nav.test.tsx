import React from 'react';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { fireEvent } from '../../../../../../test/jest';
import * as Actions from '../../../../../store/actions';
import configureStore from '../../../../../store/store';

import Nav from './nav';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

const mockHistoryReplace = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    replace: mockHistoryReplace,
  }),
}));

const render = () => {
  const store = configureStore(
    getMockConfirmState({
      metamask: {
        pendingApprovals: {
          testApprovalId: {
            id: 'testApprovalId',
            time: 1528133319641,
            origin: 'metamask',
            type: 'personal_sign',
            requestData: {
              txId: 'testTransactionId',
            },
            requestState: {
              test: 'value',
            },
          },
          testApprovalId2: {
            id: 'testApprovalId2',
            time: 1528133319641,
            origin: 'metamask',
            type: 'personal_sign',
            requestData: {
              txId: 'testTransactionId',
            },
            requestState: {
              test: 'value',
            },
          },
          testApprovalId3: {
            id: 'testApprovalId3',
            time: 1528133319649,
            origin: 'metamask',
            type: 'personal_sign',
            requestData: {
              txId: 'testTransactionId',
            },
            requestState: {
              test: 'value',
            },
          },
        },
        unapprovedPersonalMsgs: {
          testApprovalId2: {
            id: 'testApprovalId2',
            type: TransactionType.personalSign,
            chainId: '0x5',
            status: TransactionStatus.unapproved,
            msgParams: {
              from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            },
          },
        },
      },
    }),
  );

  return renderWithConfirmContextProvider(<Nav />, store);
};

describe('ConfirmNav', () => {
  it('should match snapshot', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('renders the "Reject all" Button', () => {
    const { getAllByRole, getByText } = render();
    const buttons = getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(getByText('Reject all')).toBeInTheDocument();
  });

  it('renders button to navigate to previous or next confirmation', () => {
    const { getAllByRole, getByLabelText } = render();
    const buttons = getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(getByLabelText('Previous Confirmation')).toBeInTheDocument();
    expect(getByLabelText('Next Confirmation')).toBeInTheDocument();
  });

  it('invoke history replace method when next button is clicked', () => {
    const { getByLabelText } = render();
    const nextButton = getByLabelText('Next Confirmation');
    fireEvent.click(nextButton);
    expect(mockHistoryReplace).toHaveBeenCalledTimes(1);
  });

  it('invoke action rejectPendingApproval for all pending approvals when "Reject all" button is clicked', () => {
    const { getByRole } = render();
    const rejectAllButton = getByRole('button', { name: /Reject all/iu });
    const rejectSpy = jest
      .spyOn(Actions, 'rejectPendingApproval')
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({} as any));
    fireEvent.click(rejectAllButton);
    expect(rejectSpy).toHaveBeenCalledTimes(3);
  });
});
