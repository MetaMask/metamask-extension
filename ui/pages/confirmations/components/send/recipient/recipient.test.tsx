import React from 'react';
import { fireEvent } from '@testing-library/dom';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import * as SendContext from '../../../context/send';
import { Recipient } from './recipient';

const MOCK_ADDRESS = '0xdB055877e6c13b6A6B25aBcAA29B393777dD0a73';

const mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockNavigate,
}));

const render = (args?: Record<string, unknown>) => {
  const store = configureStore(args ?? mockState);

  return renderWithProvider(<Recipient setTo={() => undefined} />, store);
};

describe('Recipient', () => {
  it('should render correctly', () => {
    const { getByText } = render();

    expect(getByText('TO')).toBeInTheDocument();
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
});
