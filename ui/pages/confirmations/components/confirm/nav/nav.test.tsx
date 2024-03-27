import React from 'react';

import mockState from '../../../../../../test/data/mock-state.json';
import { fireEvent, renderWithProvider } from '../../../../../../test/jest';
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
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
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
    },
    confirm: {
      currentConfirmation: {
        id: 'testApprovalId2',
        msgParams: {
          from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        },
      },
    },
  });

  return renderWithProvider(<Nav />, store);
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

  it('invoke history replace method when previous or next buttons are clicked', () => {
    const { getByLabelText } = render();
    const prevButton = getByLabelText('Previous Confirmation');
    fireEvent.click(prevButton);
    expect(mockHistoryReplace).toHaveBeenCalledTimes(1);
    const nextButton = getByLabelText('Next Confirmation');
    fireEvent.click(nextButton);
    expect(mockHistoryReplace).toHaveBeenCalledTimes(2);
  });

  it('invoke action rejectPendingApproval for all pending approvals when "Reject all" button is clicked', () => {
    const { getByRole } = render();
    const rejectAllButton = getByRole('button', { name: /Reject all/iu });
    const rejectSpy = jest
      .spyOn(Actions, 'rejectPendingApproval')
      .mockImplementation(() => ({} as any));
    fireEvent.click(rejectAllButton);
    expect(rejectSpy).toHaveBeenCalledTimes(3);
  });
});
