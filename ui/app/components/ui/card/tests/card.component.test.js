import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import Card from '../card.component'

describe('Card Component', function () {
  it('should render a card with a title and child element', function () {
    const wrapper = shallow(
      <Card title="Test" className="card-test-class">
        <div className="child-test-class">Child</div>
      </Card>,
    )

    assert.ok(wrapper.hasClass('card-test-class'))
    const title = wrapper.find('.card__title')
    assert.ok(title)
    assert.equal(title.text(), 'Test')
    const child = wrapper.find('.child-test-class')
    assert.ok(child)
    assert.equal(child.text(), 'Child')
  })
})
