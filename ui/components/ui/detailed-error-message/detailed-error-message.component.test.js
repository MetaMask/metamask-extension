import React from 'react';
import { shallow } from 'enzyme';
import DetailedErrorMessage from './detailed-error-message.component';

describe('DetailedErrorMessage Component', () => {
  const t = (key) => `translate ${key}`;
  let onErrorMessageClick;

  beforeEach(() => {
    onErrorMessageClick = jest.fn();
  });

  it('should render a message from props.errorMessage', () => {
    const wrapper = shallow(
      <DetailedErrorMessage
        errorMessage="This is an error."
        linkText="More Details"
        onErrorMessageClick={onErrorMessageClick}
      />,
      {
        context: { t },
      },
    );

    expect(wrapper).toHaveLength(1);
    expect(wrapper.find('.error-message')).toHaveLength(1);
    expect(wrapper.find('.error-message__icon')).toHaveLength(1);
    expect(wrapper.find('.error-message__text')).toHaveLength(1);
    expect(wrapper.find('.error-message__text').text()).toStrictEqual(
      'This is an error. More Details',
    );

    const linkText = wrapper.find('.error-message__link');
    expect(linkText.text()).toStrictEqual(' More Details');
    linkText.first().simulate('click');
    expect(onErrorMessageClick).toHaveBeenCalledTimes(1);
  });
});
