import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import NetworkListSearch from './network-list-search';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

describe('NetworkListSearch', () => {
  const mockSetSearchQuery = jest.fn();
  const mockSetFocusSearch = jest.fn();
  const useI18nContextMock = useI18nContext as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    useI18nContextMock.mockReturnValue((key: string) => key);
  });

  it('renders search list component', () => {
    const { container } = render(
      <NetworkListSearch
        searchQuery=""
        setSearchQuery={mockSetSearchQuery}
        setFocusSearch={mockSetFocusSearch}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should update search query on user input', () => {
    const { getByPlaceholderText } = render(
      <NetworkListSearch
        searchQuery=""
        setSearchQuery={mockSetSearchQuery}
        setFocusSearch={mockSetFocusSearch}
      />,
    );

    const searchInput = getByPlaceholderText('search');
    fireEvent.change(searchInput, { target: { value: 'Ethereum' } });

    expect(mockSetSearchQuery).toHaveBeenCalledWith('Ethereum');
  });

  it('should clear search query when clear button is clicked', () => {
    const { getByRole } = render(
      <NetworkListSearch
        searchQuery="Ethereum"
        setSearchQuery={mockSetSearchQuery}
        setFocusSearch={mockSetFocusSearch}
      />,
    );

    const clearButton = getByRole('button', { name: /clear/u });
    fireEvent.click(clearButton);

    expect(mockSetSearchQuery).toHaveBeenCalledWith('');
  });
});
