import React from 'react';

import mockState from '../../../../../../test/data/mock-state.json';
import { fireEvent, renderWithProvider } from '../../../../../../test/jest';
import * as Actions from '../../../../../store/actions';
import configureStore from '../../../../../store/store';

import { Footer } from '.';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
    confirm: {
      currentConfirmation: {
        msgParams: {
          from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        },
      },
    },
  });

  return renderWithProvider(<Footer />, store);
};

describe('ConfirmFooter', () => {
  it('should match snapshot', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('renders the "Cancel" and "Confirm" Buttons', () => {
    const { getAllByRole, getByText } = render();
    const buttons = getAllByRole('button');
    expect(buttons[0]).toBeInTheDocument();
    expect(buttons[1]).toBeInTheDocument();
    expect(getByText('Confirm')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });

  it('invoke action rejectPendingApproval when cancel button is clicked', () => {
    const { getAllByRole } = render();
    const cancelButton = getAllByRole('button')[0];
    const rejectSpy = jest
      .spyOn(Actions, 'rejectPendingApproval')
      .mockImplementation(() => ({} as any));
    fireEvent.click(cancelButton);
    expect(rejectSpy).toHaveBeenCalledTimes(1);
  });

  it('invoke action resolvePendingApproval when submit button is clicked', () => {
    const { getAllByRole } = render();
    const cancelButton = getAllByRole('button')[1];
    const resolveSpy = jest
      .spyOn(Actions, 'resolvePendingApproval')
      .mockImplementation(() => ({} as any));
    fireEvent.click(cancelButton);
    expect(resolveSpy).toHaveBeenCalledTimes(1);
  });
});
