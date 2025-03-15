import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmInfoRowText } from './text';
import { I18nContext } from '../../../../../contexts/i18n';

describe('ConfirmInfoRowText', () => {
  const mockText = 'Test text content';
  const mockOnEditClick = jest.fn();
  const mockTranslation = jest.fn((key) => key);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders text content correctly', () => {
    render(
      <I18nContext.Provider value={mockTranslation}>
        <ConfirmInfoRowText text={mockText} />
      </I18nContext.Provider>,
    );

    expect(screen.getByText(mockText)).toBeInTheDocument();
  });

  it('calls onEditClick when edit button is clicked', () => {
    render(
      <I18nContext.Provider value={mockTranslation}>
        <ConfirmInfoRowText
          editIconDataTestId="test-edit-nonce-id"
          text={mockText}
          onEditClick={mockOnEditClick}
        />
      </I18nContext.Provider>,
    );

    const editButton = screen.getByTestId('test-edit-nonce-id');
    fireEvent.click(editButton);
    expect(mockOnEditClick).toHaveBeenCalled();
  });

  it('renders tooltip when tooltip prop is provided', () => {
    const tooltipText = 'Test tooltip';
    render(
      <I18nContext.Provider value={mockTranslation}>
        <ConfirmInfoRowText text={mockText} tooltip={tooltipText} />
      </I18nContext.Provider>,
    );
    const tooltipElement = document.body.querySelector(`[data-original-title="${tooltipText}"]`);
    expect(tooltipElement).toBeTruthy();
  });

  it('applies custom data-testid when provided', () => {
    const testId = 'custom-test-id';
    render(
      <I18nContext.Provider value={mockTranslation}>
        <ConfirmInfoRowText text={mockText} data-testid={testId} />
      </I18nContext.Provider>,
    );

    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });

  it('escapes hidden Unicode characters in text', () => {
    const textWithHiddenUnicode = 'Hello󠁶‮world\u2028hi∞';
    render(
      <I18nContext.Provider value={mockTranslation}>
        <ConfirmInfoRowText text={textWithHiddenUnicode} />
      </I18nContext.Provider>,
    );

    const element = screen.getByRole('paragraph');
    expect(element).toHaveTextContent('HelloU+E0076U+202EworldU+2028hi∞');
  });
});
