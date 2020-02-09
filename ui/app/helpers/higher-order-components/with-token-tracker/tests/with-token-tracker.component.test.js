import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import withTokenTracker from '../with-token-tracker.component'
import TokenBalance from '../../../../components/ui/token-balance/token-balance.component'
// import sinon from 'sinon'
import TokenTracker from 'eth-token-tracker'

const { createTestProviderTools } = require('../../../../../../test/stub/provider')

const provider = createTestProviderTools({ scaffold: {} }).provider

describe('WithTokenTracker HOC', function () {
  let wrapper

  beforeEach(function () {
    const TokenTracker = withTokenTracker(TokenBalance)
    wrapper = shallow(
      <TokenTracker
        userAddress="0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc"
        token={
          {
            address: 'test',
          }
        }
      />
    )
  })

  it('#setError', function () {
    wrapper.instance().setError('test')
    assert.equal(wrapper.props().error, 'test')
  })

  it('#updateBalance', function () {
    wrapper.instance().tracker = new TokenTracker({
      provider,
    })
    wrapper.instance().updateBalance([{ string: 'test string', symbol: 'test symbol' }])
    assert.equal(wrapper.props().string, 'test string')
    assert.equal(wrapper.props().symbol, 'test symbol')
  })

})
