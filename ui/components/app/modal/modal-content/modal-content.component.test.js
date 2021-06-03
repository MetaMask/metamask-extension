import React from 'react';
import { shallow } from 'enzyme';
import ModalContent from './modal-content.component';

describe('ModalContent Component', () => {
  it('should render a title', () => {
    const wrapper = shallow(<ModalContent title="Modal Title" />);

    expect(wrapper.find('.modal-content__title')).toHaveLength(1);
    expect(wrapper.find('.modal-content__title').text()).toStrictEqual(
      'Modal Title',
    );
    expect(wrapper.find('.modal-content__description')).toHaveLength(0);
  });

  it('should render a description', () => {
    const wrapper = shallow(<ModalContent description="Modal Description" />);

    expect(wrapper.find('.modal-content__title')).toHaveLength(0);
    expect(wrapper.find('.modal-content__description')).toHaveLength(1);
    expect(wrapper.find('.modal-content__description').text()).toStrictEqual(
      'Modal Description',
    );
  });

  it('should render both a title and a description', () => {
    const wrapper = shallow(
      <ModalContent title="Modal Title" description="Modal Description" />,
    );

    expect(wrapper.find('.modal-content__title')).toHaveLength(1);
    expect(wrapper.find('.modal-content__title').text()).toStrictEqual(
      'Modal Title',
    );
    expect(wrapper.find('.modal-content__description')).toHaveLength(1);
    expect(wrapper.find('.modal-content__description').text()).toStrictEqual(
      'Modal Description',
    );
  });
});
