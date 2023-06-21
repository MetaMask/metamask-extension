import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Fuse from 'fuse.js';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { networkList } from '../../../../../.storybook/test-data';
import CustomContentSearch from './custom-content-search';

function renderComponent({ componentProps = {} } = {}) {
  const store = configureStore({});
  return renderWithProvider(<CustomContentSearch {...componentProps} />, store);
}

describe('CustomContentSearch', () => {
  it('should render custom content search correctly', () => {
    const onSearch = jest.fn();
    const wrapper = renderComponent({
      componentProps: { onSearch, networksList: networkList },
    });
    expect(wrapper.getByTestId('search-networks')).toBeDefined();
  });

  it('should check placeholder text in TextField input', () => {
    const onSearch = jest.fn();
    const wrapper = renderComponent({
      componentProps: { onSearch, networksList: networkList },
    });
    const { getByPlaceholderText } = wrapper;
    expect(
      getByPlaceholderText('Search for a previously added network'),
    ).toBeInTheDocument();
  });

  it('re-render the same component with different props', () => {
    const onSearch = jest.fn();
    const { rerender } = render(
      <CustomContentSearch
        onSearch={onSearch}
        networksList={[]}
        searchQueryInput=""
      />,
    );
    const input = screen.getByTestId('search-networks');
    expect(input.value).toBe('');
    rerender(
      <CustomContentSearch
        onSearch={onSearch}
        networksList={[]}
        searchQueryInput="Polygon"
      />,
    );
    expect(input.value).toBe('Polygon');
  });

  it('should call onSearch prop with input value', () => {
    const onSearch = jest.fn();
    const wrapper = renderComponent({
      componentProps: {
        onSearch,
        networksList: [],
        searchQueryInput: 'Avalanche',
      },
    });
    const input = wrapper.getByTestId('search-networks');
    fireEvent.change(input, { target: { value: 'Polygon' } });
    expect(input.value).toBe('Avalanche');
  });

  it('should check if error is shown if search does not return any network from the list', () => {
    const onSearch = jest.fn();
    const networksSearchFuse = new Fuse(networkList, {
      keys: ['label', 'labelKey'],
    });
    const fuseSearchResult = networksSearchFuse.search('Optimism');
    const wrapper = renderComponent({
      componentProps: {
        onSearch,
        networksList: networkList,
        searchQueryInput: 'Optimism',
        error: 'No matching results found.',
      },
    });
    const input = wrapper.getByTestId('search-networks');
    expect(fuseSearchResult).toHaveLength(0);
    fireEvent.change(input, {
      target: { error: 'No matching results found.' },
    });
    expect(input.error).toBe('No matching results found.');
  });

  it('should check if error is not shown if search return some network from the list', () => {
    const onSearch = jest.fn();
    const networksSearchFuse = new Fuse(networkList, {
      keys: ['label', 'labelKey'],
    });
    const fuseSearchResult = networksSearchFuse.search('goerli');
    const wrapper = renderComponent({
      componentProps: {
        onSearch,
        networksList: networkList,
        searchQueryInput: 'Avalanche',
        error: '',
      },
    });
    const input = wrapper.getByTestId('search-networks');
    expect(fuseSearchResult).toHaveLength(2);
    fireEvent.change(input, { target: { error: '' } });
    expect(input.error).toBe('');
  });
});
