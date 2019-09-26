import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { shallow } from 'enzyme'

import InfoBox from '../index'

describe('InfoBox', () => {

  let wrapper

  const props = {
    title: 'Title',
    description: 'Description',
    onClose: sinon.spy(),
  }

  beforeEach(() => {
    wrapper = shallow(<InfoBox {...props}/>)
  })

  it('renders title from props', () => {
    const title = wrapper.find('.info-box__title')
    assert.equal(title.text(), props.title)
  })

  it('renders description from props', () => {
    const description = wrapper.find('.info-box__description')
    assert.equal(description.text(), props.description)
  })

  it('closes info box', () => {
    const close = wrapper.find('.info-box__close')
    close.simulate('click')
    assert(props.onClose.calledOnce)
  })
})
