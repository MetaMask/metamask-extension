import React from 'react'
import assert from 'assert'
// import sinon from 'sinon'
import { shallow } from 'enzyme'
import CustomizeGasModal from '../index'

describe('CustomizeGasModal', () => {
  let wrapper

  // const props = {}

  beforeEach(() => {
    wrapper = shallow(
      <CustomizeGasModal.WrappedComponent />, {
        context: {
          t: str => str,
          metricsEvent: () => {},
        },
      }
    )
  })

  it('render', () => {
    assert.equal(wrapper.length, 1)
  })
})
