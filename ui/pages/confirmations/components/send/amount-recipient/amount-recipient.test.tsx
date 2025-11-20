import React from 'react';
import { fireEvent } from '@testing-library/dom';

import mockState from '../../../../../../test/data/mock-state.json';
import {
  EVM_ASSET,
  EVM_NATIVE_ASSET,
} from '../../../../../../test/data/send/assets';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import * as AmountSelectionMetrics from '../../../hooks/send/metrics/useAmountSelectionMetrics';
import * as AmountValidation from '../../../hooks/send/useAmountValidation';
import * as SendActions from '../../../hooks/send/useSendActions';
import * as SendContext from '../../../context/send';
import * as RecipientValidation from '../../../hooks/send/useRecipientValidation';
import * as RecipientSelectionMetrics from '../../../hooks/send/metrics/useRecipientSelectionMetrics';
import * as SendType from '../../../hooks/send/useSendType';
import { AmountRecipient } from './amount-recipient';

const MOCK_ADDRESS = '0xdB055877e6c13b6A6B25aBcAA29B393777dD0a73';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({ pathname: '/send/asset' }),
  useSearchParams: jest.fn().mockReturnValue([{ get: () => null }]),
}));

jest.mock('../../UI/send-hero', () => ({
  SendHero: () => <div data-testid="send-hero">SendHero</div>,
}));

const render = (args?: Record<string, unknown>) => {
  const store = configureStore(args ?? mockState);

  return renderWithProvider(<AmountRecipient />, store);
};

describe('AmountRecipient', () => {
  it('should render correctly', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      toResolved: MOCK_ADDRESS,
      asset: EVM_ASSET,
      chainId: '0x1',
      from: 'from-address',
      updateAsset: jest.fn(),
      updateCurrentPage: jest.fn(),
      updateTo: jest.fn(),
      updateToResolved: jest.fn(),
      updateValue: jest.fn(),
      value: '1',
    } as unknown as ReturnType<typeof SendContext.useSendContext>);
    jest.spyOn(AmountValidation, 'useAmountValidation').mockReturnValue({
      amountError: undefined,
    } as unknown as ReturnType<typeof AmountValidation.useAmountValidation>);

    const { getByText } = render();

    expect(getByText('Amount')).toBeInTheDocument();
    expect(getByText('SendHero')).toBeInTheDocument();
    expect(getByText('Continue')).toBeInTheDocument();
  });

  it('submit transaction when continue button is clicked', async () => {
    const mockHandleSubmit = jest.fn();
    jest.spyOn(SendActions, 'useSendActions').mockReturnValue({
      handleSubmit: mockHandleSubmit,
    } as unknown as ReturnType<typeof SendActions.useSendActions>);
    const mockCaptureAmountSelected = jest.fn();
    const mockCaptureRecipientSelected = jest.fn();
    jest
      .spyOn(AmountSelectionMetrics, 'useAmountSelectionMetrics')
      .mockReturnValue({
        captureAmountSelected: mockCaptureAmountSelected,
      } as unknown as ReturnType<
        typeof AmountSelectionMetrics.useAmountSelectionMetrics
      >);
    jest
      .spyOn(RecipientSelectionMetrics, 'useRecipientSelectionMetrics')
      .mockReturnValue({
        captureRecipientSelected: mockCaptureRecipientSelected,
        setRecipientInputMethodManual: jest.fn(),
      } as unknown as ReturnType<
        typeof RecipientSelectionMetrics.useRecipientSelectionMetrics
      >);
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      toResolved: MOCK_ADDRESS,
      asset: EVM_ASSET,
      chainId: '0x1',
      from: 'from-address',
      updateAsset: jest.fn(),
      updateCurrentPage: jest.fn(),
      updateTo: jest.fn(),
      updateToResolved: jest.fn(),
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
    expect(mockCaptureRecipientSelected).toHaveBeenCalled();
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
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      toResolved: MOCK_ADDRESS,
      asset: EVM_ASSET,
      chainId: '0x1',
      from: 'from-address',
      updateAsset: jest.fn(),
      updateCurrentPage: jest.fn(),
      updateTo: jest.fn(),
      updateToResolved: jest.fn(),
      updateValue: jest.fn(),
      value: '1',
    } as unknown as ReturnType<typeof SendContext.useSendContext>);

    const { getAllByRole, getByRole } = render();

    fireEvent.change(getAllByRole('textbox')[1], {
      target: { value: MOCK_ADDRESS },
    });

    fireEvent.click(getByRole('button', { name: 'Insufficient Funds' }));
    expect(mockHandleSubmit).not.toHaveBeenCalled();
  });

  it('in case of error in hex data submit button displays error and is disabled', async () => {
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
    jest
      .spyOn(AmountValidation, 'useAmountValidation')
      .mockReturnValue(
        {} as unknown as ReturnType<
          typeof AmountValidation.useAmountValidation
        >,
      );
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      toResolved: MOCK_ADDRESS,
      asset: EVM_NATIVE_ASSET,
      chainId: '0x1',
      from: 'from-address',
      updateAsset: jest.fn(),
      updateCurrentPage: jest.fn(),
      updateHexData: jest.fn(),
      updateTo: jest.fn(),
      updateToResolved: jest.fn(),
      updateValue: jest.fn(),
      value: '1',
    } as unknown as ReturnType<typeof SendContext.useSendContext>);

    const { getAllByRole, getByRole } = render({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        featureFlags: {
          ...mockState.metamask.featureFlags,
          sendHexData: true,
        },
      },
    });

    fireEvent.change(getAllByRole('textbox')[2], {
      target: { value: '###' },
    });

    fireEvent.click(getByRole('button', { name: 'Invalid hex data' }));
    expect(mockHandleSubmit).not.toHaveBeenCalled();
  });

  it('should call validateNonEvmAmountAsync for non-EVM send type and submit if no error', async () => {
    const mockHandleSubmit = jest.fn();
    const mockValidateNonEvmAmountAsync = jest.fn().mockResolvedValue(null);
    const mockCaptureAmountSelected = jest.fn();
    const mockCaptureRecipientSelected = jest.fn();

    jest.spyOn(SendActions, 'useSendActions').mockReturnValue({
      handleSubmit: mockHandleSubmit,
    } as unknown as ReturnType<typeof SendActions.useSendActions>);

    jest
      .spyOn(AmountSelectionMetrics, 'useAmountSelectionMetrics')
      .mockReturnValue({
        captureAmountSelected: mockCaptureAmountSelected,
      } as unknown as ReturnType<
        typeof AmountSelectionMetrics.useAmountSelectionMetrics
      >);

    jest
      .spyOn(RecipientSelectionMetrics, 'useRecipientSelectionMetrics')
      .mockReturnValue({
        captureRecipientSelected: mockCaptureRecipientSelected,
        setRecipientInputMethodManual: jest.fn(),
      } as unknown as ReturnType<
        typeof RecipientSelectionMetrics.useRecipientSelectionMetrics
      >);

    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      toResolved: MOCK_ADDRESS,
      asset: EVM_ASSET,
      chainId: '0x1',
      from: 'from-address',
      updateAsset: jest.fn(),
      updateCurrentPage: jest.fn(),
      updateTo: jest.fn(),
      updateToResolved: jest.fn(),
      updateValue: jest.fn(),
      value: '1',
    } as unknown as ReturnType<typeof SendContext.useSendContext>);

    jest.spyOn(AmountValidation, 'useAmountValidation').mockReturnValue({
      amountError: undefined,
      validateNonEvmAmountAsync: mockValidateNonEvmAmountAsync,
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

    jest.spyOn(SendType, 'useSendType').mockReturnValue({
      isNonEvmSendType: true,
    } as unknown as ReturnType<typeof SendType.useSendType>);

    const { getAllByRole, getByText } = render();

    fireEvent.change(getAllByRole('textbox')[0], {
      target: { value: MOCK_ADDRESS },
    });

    fireEvent.click(getByText('Continue'));

    await new Promise(process.nextTick);

    expect(mockValidateNonEvmAmountAsync).toHaveBeenCalled();
    expect(mockHandleSubmit).toHaveBeenCalled();
    expect(mockCaptureAmountSelected).toHaveBeenCalled();
    expect(mockCaptureRecipientSelected).toHaveBeenCalled();
  });

  it('should call validateNonEvmAmountAsync for non-EVM send type and not submit if there is an error', async () => {
    const mockHandleSubmit = jest.fn();
    const mockValidateNonEvmAmountAsync = jest
      .fn()
      .mockResolvedValue('Amount required');
    const mockCaptureAmountSelected = jest.fn();
    const mockCaptureRecipientSelected = jest.fn();

    jest.spyOn(SendActions, 'useSendActions').mockReturnValue({
      handleSubmit: mockHandleSubmit,
    } as unknown as ReturnType<typeof SendActions.useSendActions>);

    jest
      .spyOn(AmountSelectionMetrics, 'useAmountSelectionMetrics')
      .mockReturnValue({
        captureAmountSelected: mockCaptureAmountSelected,
      } as unknown as ReturnType<
        typeof AmountSelectionMetrics.useAmountSelectionMetrics
      >);

    jest
      .spyOn(RecipientSelectionMetrics, 'useRecipientSelectionMetrics')
      .mockReturnValue({
        captureRecipientSelected: mockCaptureRecipientSelected,
        setRecipientInputMethodManual: jest.fn(),
      } as unknown as ReturnType<
        typeof RecipientSelectionMetrics.useRecipientSelectionMetrics
      >);

    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      toResolved: MOCK_ADDRESS,
      asset: EVM_ASSET,
      chainId: '0x1',
      from: 'from-address',
      updateAsset: jest.fn(),
      updateCurrentPage: jest.fn(),
      updateTo: jest.fn(),
      updateToResolved: jest.fn(),
      updateValue: jest.fn(),
      value: '1',
    } as unknown as ReturnType<typeof SendContext.useSendContext>);

    jest.spyOn(AmountValidation, 'useAmountValidation').mockReturnValue({
      amountError: undefined,
      validateNonEvmAmountAsync: mockValidateNonEvmAmountAsync,
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

    jest.spyOn(SendType, 'useSendType').mockReturnValue({
      isNonEvmSendType: true,
    } as unknown as ReturnType<typeof SendType.useSendType>);

    const { getAllByRole, getByText } = render();

    fireEvent.change(getAllByRole('textbox')[0], {
      target: { value: MOCK_ADDRESS },
    });

    fireEvent.click(getByText('Continue'));

    await new Promise(process.nextTick);

    expect(mockValidateNonEvmAmountAsync).toHaveBeenCalled();
    expect(mockHandleSubmit).not.toHaveBeenCalled();
    expect(mockCaptureAmountSelected).not.toHaveBeenCalled();
    expect(mockCaptureRecipientSelected).not.toHaveBeenCalled();
  });
});
