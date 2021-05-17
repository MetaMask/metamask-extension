import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';

import InfoBox from './info-box.component';

describe('InfoBox', () => {
  let wrapper;

  const props = {
    title: 'Title',
    description: 'Description',
    onClose: sinon.spy(),
  };

  beforeEach(() => {
    wrapper = shallow(<InfoBox {...props} />);
  });

  it('renders title from props', () => {
    const title = wrapper.find('.info-box__title');
    expect(title.text()).toStrictEqual(props.title);
  });

  it('renders description from props', () => {
    const description = wrapper.find('.info-box__description');
    expect(description.text()).toStrictEqual(props.description);
  });

  it('closes info box', () => {
    const close = wrapper.find('.info-box__close');
    close.simulate('click');
    expect(props.onClose.calledOnce).toStrictEqual(true);
  });
});
