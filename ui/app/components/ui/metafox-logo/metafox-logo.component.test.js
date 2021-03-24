import assert from 'assert';
import React from 'react';
import { mount } from 'enzyme';
import MetaFoxLogo from '.';

describe('MetaFoxLogo', function () {
  it('sets icon height and width to 42 by default', function () {
    const wrapper = mount(<MetaFoxLogo />);

    assert.strictEqual(
      wrapper.find('img.app-header__metafox-logo--icon').prop('width'),
      42,
    );
    assert.strictEqual(
      wrapper.find('img.app-header__metafox-logo--icon').prop('height'),
      42,
    );
  });

  it('does not set icon height and width when unsetIconHeight is true', function () {
    const wrapper = mount(<MetaFoxLogo unsetIconHeight />);

    assert.strictEqual(
      wrapper.find('img.app-header__metafox-logo--icon').prop('width'),
      undefined,
    );
    assert.strictEqual(
      wrapper.find('img.app-header__metafox-logo--icon').prop('height'),
      undefined,
    );
  });
});
