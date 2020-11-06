import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { shallow } from 'enzyme'

import InfoBox from '..'

describe('InfoBox', function () {
  let wrapper

  const props = {
    title: 'Title',
    description: 'Description',
    onClose: sinon.spy(),
  }

  beforeEach(function () {
    wrapper = shallow(<InfoBox {...props} />)
  })

  it('renders title from props', function () {
    const title = wrapper.find('.info-box__title')
    assert.equal(title.text(), props.title)
  })

  it('renders description from props', function () {
    const description = wrapper.find('.info-box__description')
    assert.equal(description.text(), props.description)
  })

  it('closes info box', function () {
    const close = wrapper.find('.info-box__close')
    close.simulate('click')
    assert(props.onClose.calledOnce)
  })
})
