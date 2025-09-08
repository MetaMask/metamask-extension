import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useRecipientSelectionMetrics } from '../../../hooks/send/metrics/useRecipientSelectionMetrics';
import { useSendContext } from '../../../context/send';
import { Recipient } from './recipient';

jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../hooks/send/metrics/useRecipientSelectionMetrics');
jest.mock('../../../context/send');
jest.mock('../recipient-list', () => ({
  RecipientList: ({ hideModal }: { hideModal: () => void }) => (
    <div data-testid="recipient-list">
      <button onClick={hideModal}>Close Modal</button>
    </div>
  ),
}));

describe('Recipient', () => {
  const mockUseI18nContext = jest.mocked(useI18nContext);
  const mockUseRecipientSelectionMetrics = jest.mocked(
    useRecipientSelectionMetrics,
  );
  const mockUseSendContext = jest.mocked(useSendContext);

  const mockSetTo = jest.fn();
  const mockUpdateTo = jest.fn();
  const mockCaptureRecipientSelected = jest.fn();

  beforeEach(() => {
    mockUseI18nContext.mockReturnValue((key: string) => key.toUpperCase());
    mockUseRecipientSelectionMetrics.mockReturnValue({
      captureRecipientSelected: mockCaptureRecipientSelected,
    } as unknown as ReturnType<typeof useRecipientSelectionMetrics>);
    mockUseSendContext.mockReturnValue({
      to: '',
      updateTo: mockUpdateTo,
    } as unknown as ReturnType<typeof useSendContext>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders text field with label', () => {
    const { getByText, getByRole } = render(<Recipient setTo={mockSetTo} />);

    expect(getByText('TO')).toBeInTheDocument();
    expect(getByRole('textbox')).toBeInTheDocument();
  });

  it('renders recipient modal button', () => {
    const { getByTestId } = render(<Recipient setTo={mockSetTo} />);

    expect(getByTestId('open-recipient-modal-btn')).toBeInTheDocument();
  });

  it('calls setTo and updateTo when input value changes', () => {
    const { getByRole } = render(<Recipient setTo={mockSetTo} />);
    const input = getByRole('textbox');

    fireEvent.change(input, { target: { value: '0x1234567890abcdef' } });

    expect(mockSetTo).toHaveBeenCalledWith('0x1234567890abcdef');
    expect(mockUpdateTo).toHaveBeenCalledWith('0x1234567890abcdef');
  });

  it('displays current to value in input', () => {
    mockUseSendContext.mockReturnValue({
      to: '0x1234567890abcdef',
      updateTo: mockUpdateTo,
    } as unknown as ReturnType<typeof useSendContext>);

    const { getByRole } = render(<Recipient setTo={mockSetTo} />);
    const input = getByRole('textbox') as HTMLInputElement;

    expect(input.value).toBe('0x1234567890abcdef');
  });

  it('opens recipient modal when button is clicked', () => {
    const { getByTestId, queryByText } = render(
      <Recipient setTo={mockSetTo} />,
    );

    expect(queryByText('SELECTRECIPIENT')).not.toBeInTheDocument();

    fireEvent.click(getByTestId('open-recipient-modal-btn'));

    expect(queryByText('SELECTRECIPIENT')).toBeInTheDocument();
  });

  it('closes recipient modal when close button is clicked', () => {
    const { getByTestId, queryByText } = render(
      <Recipient setTo={mockSetTo} />,
    );

    fireEvent.click(getByTestId('open-recipient-modal-btn'));
    expect(queryByText('SELECTRECIPIENT')).toBeInTheDocument();

    fireEvent.click(getByTestId('close-recipient-modal-btn'));
    expect(queryByText('SELECTRECIPIENT')).not.toBeInTheDocument();
  });

  it('renders recipient list in modal when open', () => {
    const { getByTestId } = render(<Recipient setTo={mockSetTo} />);

    fireEvent.click(getByTestId('open-recipient-modal-btn'));

    expect(getByTestId('recipient-list')).toBeInTheDocument();
  });

  it('closes modal when recipient list hide callback is called', () => {
    const { getByTestId, getByText, queryByText } = render(
      <Recipient setTo={mockSetTo} />,
    );

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

    const { getByRole } = render(<Recipient setTo={mockSetTo} />);
    const input = getByRole('textbox');

    fireEvent.blur(input);

    expect(mockCaptureRecipientSelected).toHaveBeenCalledTimes(1);
  });

  it('does not capture metrics on input blur when to value is empty', () => {
    mockUseSendContext.mockReturnValue({
      to: '',
      updateTo: mockUpdateTo,
    } as unknown as ReturnType<typeof useSendContext>);

    const { getByRole } = render(<Recipient setTo={mockSetTo} />);
    const input = getByRole('textbox');

    fireEvent.blur(input);

    expect(mockCaptureRecipientSelected).not.toHaveBeenCalled();
  });

  it('blurs input when opening modal', () => {
    const { getByTestId, getByRole } = render(<Recipient setTo={mockSetTo} />);
    const input = getByRole('textbox');
    const button = getByTestId('open-recipient-modal-btn');

    input.focus();
    expect(document.activeElement).toBe(input);

    fireEvent.click(button);

    expect(document.activeElement).not.toBe(input);
  });
});
