import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import InfoTab from '../index'

describe('InfoTab', function () {

  let wrapper

  const testVersion = 'test version 0.0.1'

  beforeEach(function () {
    global.platform = {
      getVersion: sinon.stub().returns(testVersion),
    }

    wrapper = shallow(
      <InfoTab />, {
        context: {
          t: (str) => str,
        },
      }
    )
  })

  after(function () {
    sinon.restore()
  })

  it('renders', function () {
    assert.equal(wrapper.length, 1)
  })

  it('shows version from platform.getVersion', function () {
    const version = wrapper.find('.info-tab__version-number')
    assert.equal(version.text(), testVersion)

  })
})
