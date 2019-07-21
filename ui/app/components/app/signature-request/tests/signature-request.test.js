import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import SignatureRequest from '../signature-request.component'


describe('Signature Request Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<SignatureRequest />)
  })

  describe('render', () => {
    it('should render a div with one child', () => {
      assert(wrapper.is('div'))
      assert.equal(wrapper.children().length, 1)
    })
  })
})
