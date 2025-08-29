import React from 'react';
import { fireEvent } from '@testing-library/dom';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import * as AmountSelectionMetrics from '../../../hooks/send/metrics/useAmountSelectionMetrics';
import * as SendActions from '../../../hooks/send/useSendActions';
import { AmountRecipient } from './amount-recipient';

const MOCK_ADDRESS = '0xdB055877e6c13b6A6B25aBcAA29B393777dD0a73';

const mockHistory = {
  goBack: jest.fn(),
  push: jest.fn(),
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => mockHistory,
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({ pathname: '/send/asset' }),
  useSearchParams: jest.fn().mockReturnValue([{ get: () => null }]),
}));

const render = (args?: Record<string, unknown>) => {
  const store = configureStore(args ?? mockState);

  return renderWithProvider(<AmountRecipient />, store);
};

describe('AmountRecipient', () => {
  it('should render correctly', () => {
    const { getByText } = render();

    expect(getByText('Previous')).toBeInTheDocument();
    expect(getByText('Continue')).toBeInTheDocument();
  });

  it('submit transaction when continue button is clicked', async () => {
    const mockHandleSubmit = jest.fn();
    jest.spyOn(SendActions, 'useSendActions').mockReturnValue({
      handleSubmit: mockHandleSubmit,
    } as unknown as ReturnType<typeof SendActions.useSendActions>);
    const mockCaptureAmountSelected = jest.fn();
    jest
      .spyOn(AmountSelectionMetrics, 'useAmountSelectionMetrics')
      .mockReturnValue({
        captureAmountSelected: mockCaptureAmountSelected,
      } as unknown as ReturnType<
        typeof AmountSelectionMetrics.useAmountSelectionMetrics
      >);

    const { getAllByRole, getByText } = render();

    fireEvent.change(getAllByRole('textbox')[0], {
      target: { value: MOCK_ADDRESS },
    });

    fireEvent.click(getByText('Continue'));
    expect(mockHandleSubmit).toHaveBeenCalledWith(MOCK_ADDRESS);
    expect(mockCaptureAmountSelected).toHaveBeenCalled();
  });

  it('go to previous page when previous button is clicked', () => {
    const { getByText } = render();

    fireEvent.click(getByText('Previous'));
    expect(mockHistory.goBack).toHaveBeenCalled();
  });
});
