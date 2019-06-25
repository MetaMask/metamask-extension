import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import AddRecipient, { RecipientGroup } from '../add-recipient.component'

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
    wrapper = shallow(<AddRecipient
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

    it('should render no content if there are no recents, transfers, and contacts', () => {
      wrapper.setProps({
        ownedAccounts: [],
        addressBook: [],
      })

      assert.equal(wrapper.find('.send__select-recipient-wrapper__list__link').length, 0)
      assert.equal(wrapper.find('.send__select-recipient-wrapper__group').length, 0)
    })

    it('should render transfer', () => {
      wrapper.setProps({
        ownedAccounts: [{'0x123': { address: '0x123'}}, {'0x124': { address: '0x124'}}],
        addressBook: [],
      })

      const xferLink = wrapper.find('.send__select-recipient-wrapper__list__link')
      assert.equal(xferLink.length, 1)
      assert.equal(wrapper.find('.send__select-recipient-wrapper__group').length, 0)

      const groups = wrapper.find(RecipientGroup)
      assert.equal(groups.shallow().find('.send__select-recipient-wrapper__group').length, 0)
    })

    it('should render recents', () => {
      wrapper.setProps({
        // ownedAccounts: [{'0x123': { address: '0x123'}}, {'0x124': { address: '0x124'}}],
        addressBook: [{ address: '0x125' }],
      })

      const xferLink = wrapper.find('.send__select-recipient-wrapper__list__link')
      assert.equal(xferLink.length, 0)

      const groups = wrapper.find(RecipientGroup)
      assert.equal(groups.shallow().find('.send__select-recipient-wrapper__group-item').length, 1)
    })

    it('should render contacts', () => {
      wrapper.setProps({
        addressBook: [
          { address: '0x125', name: 'alice' },
          { address: '0x126', name: 'alex' },
          { address: '0x127', name: 'catherine' },
        ],
      })

      const xferLink = wrapper.find('.send__select-recipient-wrapper__list__link')
      assert.equal(xferLink.length, 0)

      const groups = wrapper.find(RecipientGroup)
      assert.equal(groups.length, 3)
      assert.equal(groups.at(0).shallow().find('.send__select-recipient-wrapper__group-item').length, 0)
      assert.equal(groups.at(1).shallow().find('.send__select-recipient-wrapper__group-item').length, 2)
      assert.equal(groups.at(2).shallow().find('.send__select-recipient-wrapper__group-item').length, 1)
    })
  })
})
