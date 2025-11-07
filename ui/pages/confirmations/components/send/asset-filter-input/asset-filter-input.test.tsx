import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AssetFilterInput } from './asset-filter-input';

jest.mock('../../../../../hooks/useI18nContext');
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

describe('AssetFilterInput', () => {
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
      <AssetFilterInput searchQuery="" onChange={mockOnChange} />,
    );

    expect(getByTestId('box')).toBeInTheDocument();
    expect(getByTestId('text-field-search')).toBeInTheDocument();
    expect(getByTestId('asset-filter-search-input')).toBeInTheDocument();
  });

  it('displays custom placeholder when provided', () => {
    const { getByTestId } = render(
      <AssetFilterInput
        searchQuery=""
        onChange={mockOnChange}
        placeholder="Custom placeholder"
      />,
    );

    expect(getByTestId('asset-filter-search-input')).toHaveAttribute(
      'placeholder',
      'Custom placeholder',
    );
  });

  it('displays default placeholder when none provided', () => {
    const { getByTestId } = render(
      <AssetFilterInput searchQuery="" onChange={mockOnChange} />,
    );

    expect(getByTestId('asset-filter-search-input')).toHaveAttribute(
      'placeholder',
      'searchForAnAssetToSend',
    );
  });

  it('calls onChange when input value changes', () => {
    const { getByTestId } = render(
      <AssetFilterInput searchQuery="" onChange={mockOnChange} />,
    );

    const input = getByTestId('asset-filter-search-input');
    fireEvent.change(input, { target: { value: 'new search' } });

    expect(mockOnChange).toHaveBeenCalledWith('new search');
  });

  it('displays current search query value', () => {
    const { getByTestId } = render(
      <AssetFilterInput searchQuery="current query" onChange={mockOnChange} />,
    );

    expect(getByTestId('asset-filter-search-input')).toHaveValue(
      'current query',
    );
  });

  it('clears input when clear button is clicked', () => {
    const { getByTestId } = render(
      <AssetFilterInput searchQuery="some text" onChange={mockOnChange} />,
    );

    const clearButton = getByTestId('clear-button');
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });
});
