import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import ModalContent from '../modal-content.component'

describe('ModalContent Component', function () {
  it('should render a title', function () {
    const wrapper = shallow(<ModalContent title="Modal Title" />)

    assert.equal(wrapper.find('.modal-content__title').length, 1)
    assert.equal(wrapper.find('.modal-content__title').text(), 'Modal Title')
    assert.equal(wrapper.find('.modal-content__description').length, 0)
  })

  it('should render a description', function () {
    const wrapper = shallow(<ModalContent description="Modal Description" />)

    assert.equal(wrapper.find('.modal-content__title').length, 0)
    assert.equal(wrapper.find('.modal-content__description').length, 1)
    assert.equal(
      wrapper.find('.modal-content__description').text(),
      'Modal Description',
    )
  })

  it('should render both a title and a description', function () {
    const wrapper = shallow(
      <ModalContent title="Modal Title" description="Modal Description" />,
    )

    assert.equal(wrapper.find('.modal-content__title').length, 1)
    assert.equal(wrapper.find('.modal-content__title').text(), 'Modal Title')
    assert.equal(wrapper.find('.modal-content__description').length, 1)
    assert.equal(
      wrapper.find('.modal-content__description').text(),
      'Modal Description',
    )
  })
})
