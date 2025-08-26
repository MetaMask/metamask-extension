import React from 'react';
import { fireEvent } from '@testing-library/dom';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import * as SendActions from '../../../hooks/send/useSendActions';
import * as SendContext from '../../../context/send';
import { SendTo } from './send-to';

const MOCK_ADDRESS = '0xdB055877e6c13b6A6B25aBcAA29B393777dD0a73';

const mockHistory = {
  goBack: jest.fn(),
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => mockHistory,
}));

const render = (args?: Record<string, unknown>) => {
  const store = configureStore(args ?? mockState);

  return renderWithProvider(<SendTo />, store);
};

describe('SendTo', () => {
  it('should render correctly', () => {
    const { getByText } = render();

    expect(getByText('Previous')).toBeInTheDocument();
    expect(getByText('Continue')).toBeInTheDocument();
  });

  it('call update value method when value is changed', () => {
    const mockUpdateTo = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateTo: mockUpdateTo,
    } as unknown as SendContext.SendContextType);

    const { getByRole } = render();

    fireEvent.change(getByRole('textbox'), { target: { value: MOCK_ADDRESS } });
    expect(mockUpdateTo).toHaveBeenCalledWith(MOCK_ADDRESS);
  });

  it('submit transaction when continue button is clicked', () => {
    const mockHandleSubmit = jest.fn();
    jest.spyOn(SendActions, 'useSendActions').mockReturnValue({
      handleSubmit: mockHandleSubmit,
    } as unknown as ReturnType<typeof SendActions.useSendActions>);

    const { getByRole, getByText } = render();

    fireEvent.change(getByRole('textbox'), { target: { value: MOCK_ADDRESS } });
    fireEvent.click(getByText('Continue'));
    expect(mockHandleSubmit).toHaveBeenCalledWith(MOCK_ADDRESS);
  });

  it('go to amount page when previous button is clicked', () => {
    const { getByText } = render();

    fireEvent.click(getByText('Previous'));
    expect(mockHistory.goBack).toHaveBeenCalled();
  });
});
