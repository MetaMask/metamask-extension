import React from 'react';
import { fireEvent } from '@testing-library/dom';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import * as AmountSelectionMetrics from '../../../hooks/send/metrics/useAmountSelectionMetrics';
import * as AmountValidation from '../../../hooks/send/useAmountValidation';
import * as SendActions from '../../../hooks/send/useSendActions';
import * as SendContext from '../../../context/send';
import * as RecipientValidation from '../../../hooks/send/validations/useRecipientValidation';
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

    expect(getByText('Amount')).toBeInTheDocument();
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

    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      to: MOCK_ADDRESS,
      asset: undefined,
      chainId: '0x1',
      from: 'from-address',
      updateAsset: jest.fn(),
      updateCurrentPage: jest.fn(),
      updateTo: jest.fn(),
      updateToResolvedLookup: jest.fn(),
      updateValue: jest.fn(),
      value: '1',
    } as unknown as ReturnType<typeof SendContext.useSendContext>);

    jest.spyOn(AmountValidation, 'useAmountValidation').mockReturnValue({
      amountError: undefined,
    } as unknown as ReturnType<typeof AmountValidation.useAmountValidation>);

    jest.spyOn(RecipientValidation, 'useRecipientValidation').mockReturnValue({
      recipientError: null,
      recipientWarning: null,
      recipientResolvedLookup: null,
      recipientConfusableCharacters: [],
      validateRecipient: jest.fn(),
    } as unknown as ReturnType<
      typeof RecipientValidation.useRecipientValidation
    >);

    const { getAllByRole, getByText } = render();

    fireEvent.change(getAllByRole('textbox')[0], {
      target: { value: MOCK_ADDRESS },
    });

    fireEvent.click(getByText('Continue'));
    expect(mockHandleSubmit).toHaveBeenCalled();
    expect(mockCaptureAmountSelected).toHaveBeenCalled();
  });

  it('in case of error in amount submit button displays error and is disabled', async () => {
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
    jest.spyOn(AmountValidation, 'useAmountValidation').mockReturnValue({
      amountError: 'Insufficient Funds',
    } as unknown as ReturnType<typeof AmountValidation.useAmountValidation>);

    const { getAllByRole, getByRole } = render();

    fireEvent.change(getAllByRole('textbox')[0], {
      target: { value: MOCK_ADDRESS },
    });

    fireEvent.click(getByRole('button', { name: 'Insufficient Funds' }));
    expect(mockHandleSubmit).not.toHaveBeenCalled();
  });
});
