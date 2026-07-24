import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { RecipientFilterInput } from './recipient-filter-input';

jest.mock('../../../../../hooks/useI18nContext');
jest.mock('@metamask/design-system-react', () => ({
  TextFieldSearch: ({
    value,
    onChange,
    clearButtonOnClick,
    placeholder,
    inputProps,
  }: {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    clearButtonOnClick: () => void;
    placeholder?: string;
    inputProps?: { 'data-testid'?: string };
  }) => (
    <div data-testid="text-field-search">
      <input
        {...inputProps}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
      <button data-testid="clear-button" onClick={clearButtonOnClick}>
        Clear
      </button>
    </div>
  ),
  TextFieldSize: { Lg: 'lg' },
}));
jest.mock('../../../../../components/component-library', () => ({
  Box: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div data-testid="box" {...props}>
      {children}
    </div>
  ),
}));

describe('RecipientFilterInput', () => {
  const mockUseI18nContext = jest.mocked(useI18nContext);
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockUseI18nContext.mockReturnValue((key: string) => key);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with search input', () => {
    const { getByTestId } = render(
      <RecipientFilterInput searchQuery="" onChange={mockOnChange} />,
    );

    expect(getByTestId('box')).toBeInTheDocument();
    expect(getByTestId('text-field-search')).toBeInTheDocument();
    expect(getByTestId('recipient-filter-search-input')).toBeInTheDocument();
  });

  it('displays placeholder', () => {
    const { getByTestId } = render(
      <RecipientFilterInput searchQuery="" onChange={mockOnChange} />,
    );

    expect(getByTestId('recipient-filter-search-input')).toHaveAttribute(
      'placeholder',
      'searchAnAcccountOrContact',
    );
  });

  it('calls onChange when input value changes', () => {
    const { getByTestId } = render(
      <RecipientFilterInput searchQuery="" onChange={mockOnChange} />,
    );

    const input = getByTestId('recipient-filter-search-input');
    fireEvent.change(input, { target: { value: 'new search' } });

    expect(mockOnChange).toHaveBeenCalledWith('new search');
  });

  it('displays current search query value', () => {
    const { getByTestId } = render(
      <RecipientFilterInput searchQuery="initial" onChange={mockOnChange} />,
    );

    expect(getByTestId('recipient-filter-search-input')).toHaveValue('initial');
  });

  it('clears input when clear button is clicked', () => {
    const { getByTestId } = render(
      <RecipientFilterInput searchQuery="some text" onChange={mockOnChange} />,
    );

    fireEvent.click(getByTestId('clear-button'));

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('updates when searchQuery prop changes', () => {
    const { getByTestId, rerender } = render(
      <RecipientFilterInput searchQuery="initial" onChange={mockOnChange} />,
    );

    expect(getByTestId('recipient-filter-search-input')).toHaveValue('initial');

    rerender(
      <RecipientFilterInput searchQuery="updated" onChange={mockOnChange} />,
    );

    expect(getByTestId('recipient-filter-search-input')).toHaveValue('updated');
  });

  it('clears when clear button is clicked with empty value', () => {
    const { getByTestId } = render(
      <RecipientFilterInput searchQuery="" onChange={mockOnChange} />,
    );

    fireEvent.click(getByTestId('clear-button'));

    expect(mockOnChange).toHaveBeenCalledWith('');
  });
});
