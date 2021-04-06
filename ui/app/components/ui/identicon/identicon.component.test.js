import assert from 'assert';
import React from 'react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { mount } from 'enzyme';
import Identicon from './identicon.component';

describe('Identicon', function () {
  const state = {
    metamask: {
      useBlockie: false,
    },
  };

  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);
  const store = mockStore(state);

  it('renders empty identicon with no props', function () {
    const wrapper = mount(<Identicon store={store} />);

    assert.ok(wrapper.find('div'), 'Empty identicon found');
  });

  it('renders custom image and add className props', function () {
    const wrapper = mount(
      <Identicon store={store} className="test-image" image="test-image" />,
    );

    assert.strictEqual(
      wrapper.find('img.test-image').prop('className'),
      'identicon test-image',
    );
    assert.strictEqual(
      wrapper.find('img.test-image').prop('src'),
      'test-image',
    );
  });

  it('renders div with address prop', function () {
    const wrapper = mount(
      <Identicon store={store} className="test-address" address="0xTest" />,
    );

    assert.strictEqual(
      wrapper.find('div.test-address').prop('className'),
      'identicon test-address',
    );
  });
});
