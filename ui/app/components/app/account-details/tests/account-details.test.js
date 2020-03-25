import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import proxyquire from 'proxyquire'

const clipboardSpy = sinon.spy()

const AccountDetails = proxyquire('../account-details.component.js', {
  'copy-to-clipboard': clipboardSpy,
}).default

describe('AccountDetails', function () {
  let wrapper

  const checksummedAddress = '0xAdDreSs'

  const props = {
    hideSidebar: sinon.spy(),
    showAccountDetailModal: sinon.spy(),
    showConnectedSites: sinon.spy(),
    label: 'Label',
    checksummedAddress,
    name: 'Name',
  }

  beforeEach(function () {
    wrapper = shallow(
      <AccountDetails {...props} />, {
        context: {
          t: (str) => str,
          metricsEvent: () => {},
        },
      },
    )
  })

  after(function () {
    sinon.restore()
  })

  it('clicks copy to clipboard with address and changes state', function () {
    const accountDetails = wrapper.find('.account-details__address')
    accountDetails.simulate('click')

    assert(clipboardSpy.calledOnce)
    assert.equal(clipboardSpy.getCall(0).args[0], checksummedAddress)
    assert.equal(wrapper.state('hasCopied'), true)
  })

  it('changes copyToClipboardPressed boolean state on mousedown and mouseup', function () {
    const accountDetails = wrapper.find('.account-details__address')
    accountDetails.simulate('mousedown')

    assert.equal(wrapper.state('copyToClipboardPressed'), true)

    accountDetails.simulate('mouseup')
    assert.equal(wrapper.state('copyToClipboardPressed'), false)

  })
})
