import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import SendContent from '../send-content.component.js'

import PageContainerContent from '../../../page-container/page-container-content.component'
import SendAmountRow from '../send-amount-row/send-amount-row.container'
import SendFromRow from '../send-from-row/send-from-row.container'
import SendGasRow from '../send-gas-row/send-gas-row.container'
import SendToRow from '../send-to-row/send-to-row.container'

describe('SendContent Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<SendContent />)
  })

  describe('render', () => {
    it('should render a PageContainerContent component', () => {
      assert.equal(wrapper.find(PageContainerContent).length, 1)
    })

    it('should render a div with a .send-v2__form class as a child of PageContainerContent', () => {
      const PageContainerContentChild = wrapper.find(PageContainerContent).children()
      PageContainerContentChild.is('div')
      PageContainerContentChild.is('.send-v2__form')
    })

    it('should render the correct row components as grandchildren of the PageContainerContent component', () => {
      const PageContainerContentChild = wrapper.find(PageContainerContent).children()
      assert(PageContainerContentChild.childAt(0).is(SendFromRow))
      assert(PageContainerContentChild.childAt(1).is(SendToRow))
      assert(PageContainerContentChild.childAt(2).is(SendAmountRow))
      assert(PageContainerContentChild.childAt(3).is(SendGasRow))
    })
  })
})
