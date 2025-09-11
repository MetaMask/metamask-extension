import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useRecipientSelectionMetrics } from '../../../hooks/send/metrics/useRecipientSelectionMetrics';
import { useRecipientValidation } from '../../../hooks/send/validations/useRecipientValidation';
import { useSendContext } from '../../../context/send';
import { useRecipients } from '../../../hooks/send/useRecipients';
import { Recipient } from './recipient';

jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../hooks/send/metrics/useRecipientSelectionMetrics');
jest.mock('../../../hooks/send/validations/useRecipientValidation');
jest.mock('../../../context/send');
jest.mock('../../../hooks/send/useRecipients');
jest.mock('../recipient-list', () => ({
  RecipientList: ({
    hideModal,
    onToChange,
  }: {
    hideModal: () => void;
    onToChange: () => void;
  }) => {
    return (
      <div data-testid="recipient-list" onClick={onToChange}>
        <button onClick={hideModal}>Close Modal</button>
      </div>
    );
  },
}));

describe('Recipient', () => {
  const mockUseI18nContext = jest.mocked(useI18nContext);
  const mockUseRecipientSelectionMetrics = jest.mocked(
    useRecipientSelectionMetrics,
  );
  const mockUseRecipientValidation = jest.mocked(useRecipientValidation);
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

  const renderComponent = () => {
    return renderWithProvider(<Recipient />, mockStore);
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
    mockUseRecipientValidation.mockReturnValue({
      recipientConfusableCharacters: [],
      recipientError: null,
      recipientWarning: null,
      recipientResolvedLookup: null,
    } as unknown as ReturnType<typeof useRecipientValidation>);
    mockUseSendContext.mockReturnValue({
      to: '',
      updateTo: mockUpdateTo,
    } as unknown as ReturnType<typeof useSendContext>);
    mockUseRecipients.mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders text field with label', () => {
    const { getByText, getByRole } = renderComponent();

    expect(getByText('TO')).toBeInTheDocument();
    expect(getByRole('textbox')).toBeInTheDocument();
  });

  it('renders recipient modal button when recipients exist', () => {
    mockUseRecipients.mockReturnValue(mockRecipients);
    const { getByTestId } = renderComponent();

    expect(getByTestId('open-recipient-modal-btn')).toBeInTheDocument();
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
    } as unknown as ReturnType<typeof useSendContext>);

    const { getByRole } = renderComponent();
    const input = getByRole('textbox') as HTMLInputElement;

    expect(input.value).toBe('0x1234567890abcdef');
  });

  it('opens recipient modal when button is clicked', () => {
    mockUseRecipients.mockReturnValue(mockRecipients);
    const { getByTestId, queryByText } = renderComponent();

    expect(queryByText('SELECTRECIPIENT')).not.toBeInTheDocument();

    fireEvent.click(getByTestId('open-recipient-modal-btn'));

    expect(queryByText('SELECTRECIPIENT')).toBeInTheDocument();
  });

  it('closes recipient modal when close button is clicked', () => {
    mockUseRecipients.mockReturnValue(mockRecipients);
    const { getByTestId, queryByText } = renderComponent();

    fireEvent.click(getByTestId('open-recipient-modal-btn'));
    expect(queryByText('SELECTRECIPIENT')).toBeInTheDocument();

    fireEvent.click(getByTestId('close-recipient-modal-btn'));
    expect(queryByText('SELECTRECIPIENT')).not.toBeInTheDocument();
  });

  it('renders recipient list in modal when open', () => {
    mockUseRecipients.mockReturnValue(mockRecipients);
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('open-recipient-modal-btn'));

    expect(getByTestId('recipient-list')).toBeInTheDocument();
  });

  it('closes modal when recipient list hide callback is called', () => {
    mockUseRecipients.mockReturnValue(mockRecipients);
    const { getByTestId, getByText, queryByText } = renderComponent();

    fireEvent.click(getByTestId('open-recipient-modal-btn'));
    expect(queryByText('SELECTRECIPIENT')).toBeInTheDocument();

    fireEvent.click(getByText('Close Modal'));
    expect(queryByText('SELECTRECIPIENT')).not.toBeInTheDocument();
  });

  it('captures metrics on input blur when to value exists', () => {
    mockUseSendContext.mockReturnValue({
      to: '0x1234567890abcdef',
      updateTo: mockUpdateTo,
    } as unknown as ReturnType<typeof useSendContext>);

    const { getByRole } = renderComponent();
    const input = getByRole('textbox');

    fireEvent.blur(input);

    expect(mockCaptureRecipientSelected).toHaveBeenCalledTimes(1);
  });

  it('does not capture metrics on input blur when to value is empty', () => {
    mockUseSendContext.mockReturnValue({
      to: '',
      updateTo: mockUpdateTo,
    } as unknown as ReturnType<typeof useSendContext>);

    const { getByRole } = renderComponent();
    const input = getByRole('textbox');

    fireEvent.blur(input);

    expect(mockCaptureRecipientSelected).not.toHaveBeenCalled();
  });

  it('blurs input when opening modal', () => {
    mockUseRecipients.mockReturnValue(mockRecipients);
    const { getByTestId, getByRole } = renderComponent();
    const input = getByRole('textbox');
    const button = getByTestId('open-recipient-modal-btn');

    input.focus();
    expect(document.activeElement).toBe(input);

    fireEvent.click(button);

    expect(document.activeElement).not.toBe(input);
  });

  it('renders clear button when to value exists', () => {
    mockUseSendContext.mockReturnValue({
      to: '0x1234567890abcdef',
      updateTo: mockUpdateTo,
    } as unknown as ReturnType<typeof useSendContext>);

    const { getByTestId } = renderComponent();

    expect(getByTestId('clear-recipient-btn')).toBeInTheDocument();
  });

  it('clears recipient when clear button is clicked', () => {
    mockUseSendContext.mockReturnValue({
      to: '0x1234567890abcdef',
      updateTo: mockUpdateTo,
    } as unknown as ReturnType<typeof useSendContext>);

    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('clear-recipient-btn'));

    expect(mockUpdateTo).toHaveBeenCalledWith('');
  });

  it('does not render modal button when no recipients exist', () => {
    mockUseRecipients.mockReturnValue([]);
    const { queryByTestId } = renderComponent();

    expect(queryByTestId('open-recipient-modal-btn')).not.toBeInTheDocument();
  });

  describe('metrics', () => {
    it('calls captureRecipientSelected when recipient is selected from modal', () => {
      const { getByTestId } = renderComponent();
      fireEvent.click(getByTestId('open-recipient-modal-btn'));
      fireEvent.click(getByTestId('recipient-list'));
      expect(mockSetRecipientInputMethodSelectAccount).toHaveBeenCalled();
    });
  });
});
