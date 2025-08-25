import React from 'react';
import { fireEvent } from '@testing-library/dom';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import * as SendContext from '../../../context/send';
import { Amount } from './amount';

const mockHistory = {
  goBack: jest.fn(),
  push: jest.fn(),
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => mockHistory,
}));

const render = (args?: Record<string, unknown>) => {
  const store = configureStore(args ?? mockState);

  return renderWithProvider(<Amount />, store);
};

describe('Amount', () => {
  it('should render correctly', () => {
    const { getByText } = render();

    expect(getByText('Previous')).toBeInTheDocument();
    expect(getByText('Continue')).toBeInTheDocument();
  });

  it('call update value method when value is changed', () => {
    const mockUpdateValue = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateValue: mockUpdateValue,
    } as unknown as SendContext.SendContextType);

    const { getByRole } = render();

    fireEvent.change(getByRole('textbox'), { target: { value: 1 } });
    expect(mockUpdateValue).toHaveBeenCalledWith('1');
  });

  it('go to sendTo page when continue button is clicked', () => {
    const { getByText } = render();

    fireEvent.click(getByText('Continue'));
    expect(mockHistory.push).toHaveBeenCalledWith('/send/recipient');
  });

  it('go to previous page when previous button is clicked', () => {
    const { getByText } = render();

    fireEvent.click(getByText('Previous'));
    expect(mockHistory.goBack).toHaveBeenCalled();
  });
});
