import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import InfoTab from '../index'

describe('Info Tab', () => {
  let wrapper

  beforeEach(() => {
    global.platform = { getVersion: sinon.stub().returns('1.0.0') }
    wrapper = mount(
      <InfoTab />, {
        context: {
          t: str => str,
        },
      }
    )
  })

  afterEach(() => {
    global.platform.getVersion.reset()
  })

  it('renders', () => {
    assert.equal(wrapper.length, 1)
  })
})
