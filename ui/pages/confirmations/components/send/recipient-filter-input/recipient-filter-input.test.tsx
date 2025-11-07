import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { RecipientFilterInput } from './recipient-filter-input';

jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../../../components/component-library', () => ({
  Box: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }) => (
    <div data-testid="box" {...props}>
      {children}
    </div>
  ),
  TextFieldSearch: ({
    value,
    onChange,
    clearButtonOnClick,
    placeholder,
    inputProps,
    ...props
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) => (
    <div data-testid="text-field-search">
      <input
        {...inputProps}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        {...props}
      />
      <button data-testid="clear-button" onClick={clearButtonOnClick}>
        Clear
      </button>
    </div>
  ),
  ButtonIconSize: { Sm: 'sm' },
  TextFieldSearchSize: { Lg: 'lg' },
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

  it('displays default placeholder', () => {
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
      <RecipientFilterInput
        searchQuery="current query"
        onChange={mockOnChange}
      />,
    );

    expect(getByTestId('recipient-filter-search-input')).toHaveValue(
      'current query',
    );
  });

  it('clears input when clear button is clicked', () => {
    const { getByTestId } = render(
      <RecipientFilterInput searchQuery="some text" onChange={mockOnChange} />,
    );

    const clearButton = getByTestId('clear-button');
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('calls useI18nContext hook', () => {
    render(<RecipientFilterInput searchQuery="" onChange={mockOnChange} />);

    expect(mockUseI18nContext).toHaveBeenCalledTimes(1);
  });

  it('updates value when searchQuery prop changes', () => {
    const { getByTestId, rerender } = render(
      <RecipientFilterInput searchQuery="initial" onChange={mockOnChange} />,
    );

    expect(getByTestId('recipient-filter-search-input')).toHaveValue('initial');

    rerender(
      <RecipientFilterInput searchQuery="updated" onChange={mockOnChange} />,
    );

    expect(getByTestId('recipient-filter-search-input')).toHaveValue('updated');
  });

  it('renders with empty search query', () => {
    const { getByTestId } = render(
      <RecipientFilterInput searchQuery="" onChange={mockOnChange} />,
    );

    expect(getByTestId('recipient-filter-search-input')).toHaveValue('');
  });
});
