import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

const SendToRow = proxyquire('../add-recipient.component.js', {
  './add-recipient.js': {
    getToErrorObject: (to, toError) => ({
      to: to === false ? null : `mockToErrorObject:${to}${toError}`,
    }),
    getToWarningObject: (to, toWarning) => ({
      to: to === false ? null : `mockToWarningObject:${to}${toWarning}`,
    }),
  },
}).default

const propsMethodSpies = {
  closeToDropdown: sinon.spy(),
  openToDropdown: sinon.spy(),
  updateGas: sinon.spy(),
  updateSendTo: sinon.spy(),
  updateSendToError: sinon.spy(),
  updateSendToWarning: sinon.spy(),
}

describe('AddRecipient Component', function () {
  let wrapper
  let instance

  beforeEach(() => {
    wrapper = shallow(<SendToRow
      closeToDropdown={propsMethodSpies.closeToDropdown}
      inError={false}
      inWarning={false}
      network={'mockNetwork'}
      openToDropdown={propsMethodSpies.openToDropdown}
      to={'mockTo'}
      toAccounts={['mockAccount']}
      toDropdownOpen={false}
      updateGas={propsMethodSpies.updateGas}
      updateSendTo={propsMethodSpies.updateSendTo}
      updateSendToError={propsMethodSpies.updateSendToError}
      updateSendToWarning={propsMethodSpies.updateSendToWarning}
      addressBook={[{ address: '0x80F061544cC398520615B5d3e7A3BedD70cd4510', name: 'Fav 5' }]}
    />, { context: { t: str => str + '_t' } })
    instance = wrapper.instance()
  })

  afterEach(() => {
    propsMethodSpies.closeToDropdown.resetHistory()
    propsMethodSpies.openToDropdown.resetHistory()
    propsMethodSpies.updateSendTo.resetHistory()
    propsMethodSpies.updateSendToError.resetHistory()
    propsMethodSpies.updateSendToWarning.resetHistory()
    propsMethodSpies.updateGas.resetHistory()
  })

  describe('selectRecipient', () => {

    it('should call updateSendTo', () => {
      assert.equal(propsMethodSpies.updateSendTo.callCount, 0)
      instance.selectRecipient('mockTo2', 'mockNickname')
      assert.equal(propsMethodSpies.updateSendTo.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.updateSendTo.getCall(0).args,
        ['mockTo2', 'mockNickname']
      )
    })

    it('should call updateGas if there is no to error', () => {
      assert.equal(propsMethodSpies.updateGas.callCount, 0)
      instance.selectRecipient(false)
      assert.equal(propsMethodSpies.updateGas.callCount, 1)
    })
  })

  describe('render', () => {
    it('should render a component', () => {
      assert.equal(wrapper.find('.send__select-recipient-wrapper').length, 1)
    })
  })
})
