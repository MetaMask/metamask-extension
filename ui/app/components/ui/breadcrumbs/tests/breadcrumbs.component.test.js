import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import Breadcrumbs from '../breadcrumbs.component'

describe('Breadcrumbs Component', function () {
  it('should render with the correct colors', function () {
    const wrapper = shallow(<Breadcrumbs currentIndex={1} total={3} />)

    assert.ok(wrapper)
    assert.equal(wrapper.find('.breadcrumbs').length, 1)
    assert.equal(wrapper.find('.breadcrumb').length, 3)
    assert.equal(
      wrapper.find('.breadcrumb').at(0).props().style.backgroundColor,
      '#FFFFFF',
    )
    assert.equal(
      wrapper.find('.breadcrumb').at(1).props().style.backgroundColor,
      '#D8D8D8',
    )
    assert.equal(
      wrapper.find('.breadcrumb').at(2).props().style.backgroundColor,
      '#FFFFFF',
    )
  })
})
