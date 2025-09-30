import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useRecipientSelectionMetrics } from '../../../hooks/send/metrics/useRecipientSelectionMetrics';
import { useSendContext } from '../../../context/send';
import { useRecipients } from '../../../hooks/send/useRecipients';
import { useRecipientValidation } from '../../../hooks/send/useRecipientValidation';
import { RecipientInput } from './recipient-input';

jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../hooks/send/metrics/useRecipientSelectionMetrics');
jest.mock('../../../context/send');
jest.mock('../../../hooks/send/useRecipients');

describe('RecipientInput', () => {
  const mockUseI18nContext = jest.mocked(useI18nContext);
  const mockUseRecipientSelectionMetrics = jest.mocked(
    useRecipientSelectionMetrics,
  );
  const mockUseSendContext = jest.mocked(useSendContext);
  const mockUseRecipients = jest.mocked(useRecipients);

  const mockUpdateTo = jest.fn();
  const mockCaptureRecipientSelected = jest.fn();
  const mockSetRecipientInputMethodManual = jest.fn();
  const mockSetRecipientInputMethodSelectContact = jest.fn();
  const mockSetRecipientInputMethodSelectAccount = jest.fn();

  const mockStore = configureStore(mockState);

  const mockRecipients = [
    {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'Recipient 1',
    },
    {
      address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      name: 'Recipient 2',
    },
  ];

  const renderComponent = (args = {}) => {
    return renderWithProvider(
      <RecipientInput
        recipientValidationResult={
          {
            recipientConfusableCharacters: [],
            recipientError: null,
            recipientWarning: null,
            recipientResolvedLookup: undefined,
          } as unknown as ReturnType<typeof useRecipientValidation>
        }
        openRecipientModal={() => {}}
        recipientInputRef={null as unknown as React.RefObject<HTMLInputElement>}
        {...args}
      />,
      mockStore,
    );
  };

  beforeEach(() => {
    mockUseI18nContext.mockReturnValue((key: string) => key.toUpperCase());
    mockUseRecipientSelectionMetrics.mockReturnValue({
      captureRecipientSelected: mockCaptureRecipientSelected,
      setRecipientInputMethodManual: mockSetRecipientInputMethodManual,
      setRecipientInputMethodSelectContact:
        mockSetRecipientInputMethodSelectContact,
      setRecipientInputMethodSelectAccount:
        mockSetRecipientInputMethodSelectAccount,
    } as unknown as ReturnType<typeof useRecipientSelectionMetrics>);
    mockUseSendContext.mockReturnValue({
      to: '',
      updateTo: mockUpdateTo,
      updateToResolved: jest.fn(),
    } as unknown as ReturnType<typeof useSendContext>);
    mockUseRecipients.mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders text field', () => {
    const { getByRole } = renderComponent();
    expect(getByRole('textbox')).toBeInTheDocument();
  });

  it('calls updateTo when input value changes', () => {
    const { getByRole } = renderComponent();
    const input = getByRole('textbox');

    fireEvent.change(input, { target: { value: '0x1234567890abcdef' } });
    expect(mockUpdateTo).toHaveBeenCalledWith('0x1234567890abcdef');
  });

  it('displays current to value in input', () => {
    mockUseSendContext.mockReturnValue({
      to: '0x1234567890abcdef',
      updateTo: mockUpdateTo,
      updateToResolved: jest.fn(),
    } as unknown as ReturnType<typeof useSendContext>);

    const { getByRole } = renderComponent();
    const input = getByRole('textbox') as HTMLInputElement;

    expect(input.value).toBe('0x1234567890abcdef');
  });

  it('calls openRecipientModal when address book icon clicked', () => {
    const mockOpenRecipientModal = jest.fn();
    mockUseRecipients.mockReturnValue(mockRecipients);
    const { getByTestId } = renderComponent({
      openRecipientModal: mockOpenRecipientModal,
    });

    fireEvent.click(getByTestId('open-recipient-modal-btn'));
    expect(mockOpenRecipientModal).toHaveBeenCalled();
  });

  it('captures metrics on input blur when to value exists', () => {
    mockUseSendContext.mockReturnValue({
      to: '0x1234567890abcdef',
      updateTo: mockUpdateTo,
      updateToResolved: jest.fn(),
    } as unknown as ReturnType<typeof useSendContext>);

    const { getByRole } = renderComponent();
    const input = getByRole('textbox');

    fireEvent.blur(input);

    expect(mockCaptureRecipientSelected).toHaveBeenCalledTimes(1);
  });

  it('renders clear button when to has no error', () => {
    mockUseSendContext.mockReturnValue({
      to: '0x1234567890abcdef',
      updateTo: mockUpdateTo,
      updateToResolved: jest.fn(),
    } as unknown as ReturnType<typeof useSendContext>);

    const { getByTestId } = renderComponent({
      recipientValidationResult: {
        toAddressValidated: '0x1234567890abcdef',
      },
    });

    expect(getByTestId('clear-recipient-btn')).toBeInTheDocument();
  });

  it('clears recipient when clear button is clicked', () => {
    mockUseSendContext.mockReturnValue({
      to: '0x1234567890abcdef',
      updateTo: mockUpdateTo,
      updateToResolved: jest.fn(),
    } as unknown as ReturnType<typeof useSendContext>);

    const { getByTestId } = renderComponent({
      recipientValidationResult: {
        toAddressValidated: '0x1234567890abcdef',
      },
    });

    fireEvent.click(getByTestId('clear-recipient-btn'));

    expect(mockUpdateTo).toHaveBeenCalledWith('');
  });
});
