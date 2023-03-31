import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import sinon from 'sinon';
import { hideModal } from '../../../store/actions';
import ComplianceModal from '.';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  hideModal: jest.fn(),
}));

describe('ComplianceModal', () => {
  let dispatchMock;

  beforeEach(() => {
    dispatchMock = jest.fn();
    useDispatch.mockReturnValue(dispatchMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render the correct content', () => {
    const { container, getByTestId } = render(<ComplianceModal />);

    expect(getByTestId('compliance-info')).toBeInTheDocument();
    expect(getByTestId('compliance-bullets')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('should close the modal when close button is clicked', () => {
    const { getByTestId } = render(<ComplianceModal />);

    fireEvent.click(getByTestId('compliance-modal-close'));

    expect(hideModal).toHaveBeenCalled();
    expect(dispatchMock).toHaveBeenCalledWith(hideModal());
  });

  it('should open the Compliance page when submit button is clicked', () => {
    global.platform = { openTab: sinon.spy() };
    const { container } = render(<ComplianceModal />);

    const btn = container.getElementsByClassName('btn-primary')[0];

    fireEvent.click(btn);

    expect(global.platform.openTab.called).toBeTruthy();
  });
});
