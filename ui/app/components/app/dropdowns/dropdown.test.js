import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { DropdownMenuItem } from './dropdown';

describe('Dropdown', () => {
  let wrapper;
  const onClickSpy = sinon.spy();
  const closeMenuSpy = sinon.spy();

  beforeEach(() => {
    wrapper = shallow(
      <DropdownMenuItem
        onClick={onClickSpy}
        style={{ test: 'style' }}
        closeMenu={closeMenuSpy}
      />,
    );
  });

  it('renders li with dropdown-menu-item class', () => {
    expect(wrapper.find('li.dropdown-menu-item')).toHaveLength(1);
  });

  it('adds style based on props passed', () => {
    expect(wrapper.prop('style').test).toStrictEqual('style');
  });

  it('simulates click event and calls onClick and closeMenu', () => {
    wrapper.prop('onClick')();
    expect(onClickSpy.callCount).toStrictEqual(1);
    expect(closeMenuSpy.callCount).toStrictEqual(1);
  });
});
