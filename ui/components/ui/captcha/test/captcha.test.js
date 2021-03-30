import assert from 'assert';
import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';

import Captcha from '..';

describe('Captcha component', function () {
  let wrapper;

  const props = {
    elementId: '271edf',
  };

  before(function () {
    sinon.spy(Captcha.prototype, 'componentDidMount');
  });

  beforeEach(function () {
    wrapper = shallow(<Captcha {...props} />);
  });

  it('calls componentDidMount', function () {
    assert(Captcha.prototype.componentDidMount.calledOnce);
  });

  it('should render captcha wrapper block', function () {
    const captchaWrapper = wrapper.find(`#hcaptcha-${props.elementId}`);
    assert.ok(captchaWrapper);
    assert.equal(wrapper.length, 1);
  });
});
