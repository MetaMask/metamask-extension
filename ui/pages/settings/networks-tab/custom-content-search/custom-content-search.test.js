import React from 'react';
import { shallow, mount } from 'enzyme';
import TextField from '../../../../components/ui/text-field';
import CustomContentSearch from './custom-content-search';

describe('CustomContentSearch', () => {
  let wrapper;

  it('should render custom content search correctly', () => {
    wrapper = shallow(
      <CustomContentSearch onSearch={() => undefined} networksList={[]} />,
      {
        context: {
          t: (s) => `${s}`,
        },
      },
    );

    expect(wrapper.find(TextField).props().id).toStrictEqual('search-networks');
    expect(wrapper.find(TextField).props().value).toBeUndefined();
  });

  it('should call onSearch prop with input value', () => {
    const onSearch = jest.fn();
    wrapper = mount(
      <CustomContentSearch
        onSearch={onSearch}
        networksList={[]}
        searchQueryInput="Avalanche"
      />,
    );
    wrapper.find('input').simulate('change');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ searchQuery: 'Avalanche' }),
    );
    expect(wrapper.find(TextField).at(0).prop('value')).toStrictEqual(
      'Avalanche',
    );
  });

  it('should check if error is shown if search does not return any network from the list', () => {
    const onSearch = jest.fn();
    const networksList = [
      { label: 'Ethereum Mainnet' },
      { label: 'Binance Smart Chain' },
      { label: 'Polygon' },
      { label: 'Ropsten Test Network' },
      { label: 'Rinkeby Test Network' },
    ];
    wrapper = mount(
      <CustomContentSearch
        onSearch={onSearch}
        networksList={networksList}
        searchQueryInput="Avalanche"
        error="No matching results found."
      />,
    );
    wrapper.find('input').simulate('change');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ results: [] }),
    );
    expect(wrapper.find(TextField).at(0).prop('error')).toStrictEqual(
      'No matching results found.',
    );
  });

  it('should check if error is not shown if search return some network from the list', () => {
    const onSearch = jest.fn();
    const networksList = [
      { label: 'Ethereum Mainnet' },
      { label: 'Binance Smart Chain' },
      { label: 'Polygon' },
      { label: 'Ropsten Test Network' },
      { label: 'Rinkeby Test Network' },
    ];
    wrapper = mount(
      <CustomContentSearch
        onSearch={onSearch}
        networksList={networksList}
        searchQueryInput="Polygon"
        error=""
      />,
    );
    wrapper.find('input').simulate('change');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ results: [{ label: 'Polygon' }] }),
    );
    expect(wrapper.find(TextField).at(0).prop('error')).toStrictEqual('');
  });
});
