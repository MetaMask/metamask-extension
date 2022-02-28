import React from 'react';
import { shallow } from 'enzyme';
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
});
