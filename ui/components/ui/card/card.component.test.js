import React from 'react';
import { shallow } from 'enzyme';
import Card from './card.component';

describe('Card Component', () => {
  it('should render a card with a title and child element', () => {
    const wrapper = shallow(
      <Card title="Test" className="card-test-class">
        <div className="child-test-class">Child</div>
      </Card>,
    );

    expect(wrapper.hasClass('card-test-class')).toStrictEqual(true);
    const title = wrapper.find('.card__title');
    expect(title).toHaveLength(1);
    expect(title.text()).toStrictEqual('Test');
    const child = wrapper.find('.child-test-class');
    expect(child).toHaveLength(1);
    expect(child.text()).toStrictEqual('Child');
  });
});
