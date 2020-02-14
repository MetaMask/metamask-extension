import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes'
import SendHeader from '../send-header.component.js'
import PageContainerHeader from '../../../../components/ui/page-container/page-container-header'

describe('SendHeader Component', function () {
  let wrapper

  const propsMethodSpies = {
    clearSend: sinon.spy(),
  }
  const historySpies = {
    push: sinon.spy(),
  }

  before(function () {
    sinon.spy(SendHeader.prototype, 'onClose')
  })

  beforeEach(function () {
    wrapper = shallow((
      <SendHeader
        clearSend={propsMethodSpies.clearSend}
        history={historySpies}
        titleKey="mockTitleKey"
      />
    ), { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } })
  })

  afterEach(function () {
    propsMethodSpies.clearSend.resetHistory()
    historySpies.push.resetHistory()
    SendHeader.prototype.onClose.resetHistory()
  })

  after(function () {
    sinon.restore()
  })

  describe('onClose', function () {
    it('should call clearSend', function () {
      assert.equal(propsMethodSpies.clearSend.callCount, 0)
      wrapper.instance().onClose()
      assert.equal(propsMethodSpies.clearSend.callCount, 1)
    })

    it('should call history.push', function () {
      assert.equal(historySpies.push.callCount, 0)
      wrapper.instance().onClose()
      assert.equal(historySpies.push.callCount, 1)
      assert.equal(historySpies.push.getCall(0).args[0], DEFAULT_ROUTE)
    })
  })

  describe('render', function () {
    it('should render a PageContainerHeader compenent', function () {
      assert.equal(wrapper.find(PageContainerHeader).length, 1)
    })

    it('should pass the correct props to PageContainerHeader', function () {
      const {
        onClose,
        title,
      } = wrapper.find(PageContainerHeader).props()
      assert.equal(title, 'mockTitleKey')
      assert.equal(SendHeader.prototype.onClose.callCount, 0)
      onClose()
      assert.equal(SendHeader.prototype.onClose.callCount, 1)
    })
  })
})
