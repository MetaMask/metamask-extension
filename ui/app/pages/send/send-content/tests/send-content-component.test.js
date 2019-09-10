import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import SendContent from '../send-content.component.js'

import PageContainerContent from '../../../../components/ui/page-container/page-container-content.component'
import SendAmountRow from '../send-amount-row/send-amount-row.container'
import SendGasRow from '../send-gas-row/send-gas-row.container'
import SendHexDataRow from '../send-hex-data-row/send-hex-data-row.container'
import SendAssetRow from '../send-asset-row/send-asset-row.container'
import Dialog from '../../../../components/ui/dialog'

describe('SendContent Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(
      <SendContent
        showHexData={true}
      />,
      { context: { t: str => str + '_t' } }
    )
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
      assert(PageContainerContentChild.childAt(0).is(Dialog), 'row[0] should be Dialog')
      assert(PageContainerContentChild.childAt(1).is(SendAssetRow), 'row[1] should be SendAssetRow')
      assert(PageContainerContentChild.childAt(2).is(SendAmountRow), 'row[2] should be SendAmountRow')
      assert(PageContainerContentChild.childAt(3).is(SendGasRow), 'row[3] should be SendGasRow')
      assert(PageContainerContentChild.childAt(4).is(SendHexDataRow), 'row[4] should be SendHexDataRow')
    })

    it('should not render the SendHexDataRow if props.showHexData is false', () => {
      wrapper.setProps({ showHexData: false })
      const PageContainerContentChild = wrapper.find(PageContainerContent).children()
      assert(PageContainerContentChild.childAt(0).is(Dialog), 'row[0] should be Dialog')
      assert(PageContainerContentChild.childAt(1).is(SendAssetRow), 'row[1] should be SendAssetRow')
      assert(PageContainerContentChild.childAt(2).is(SendAmountRow), 'row[2] should be SendAmountRow')
      assert(PageContainerContentChild.childAt(3).is(SendGasRow), 'row[3] should be SendGasRow')
      assert.equal(PageContainerContentChild.childAt(4).exists(), false)
    })

    it('should not render the Dialog if contact has a name', () => {
      wrapper.setProps({
        showHexData: false,
        contact: { name: 'testName' },
      })
      const PageContainerContentChild = wrapper.find(PageContainerContent).children()
      assert(PageContainerContentChild.childAt(0).is(SendAssetRow), 'row[1] should be SendAssetRow')
      assert(PageContainerContentChild.childAt(1).is(SendAmountRow), 'row[2] should be SendAmountRow')
      assert(PageContainerContentChild.childAt(2).is(SendGasRow), 'row[3] should be SendGasRow')
      assert.equal(PageContainerContentChild.childAt(3).exists(), false)
    })

    it('should not render the Dialog if it is an ownedAccount', () => {
      wrapper.setProps({
        showHexData: false,
        isOwnedAccount: true,
      })
      const PageContainerContentChild = wrapper.find(PageContainerContent).children()
      assert(PageContainerContentChild.childAt(0).is(SendAssetRow), 'row[1] should be SendAssetRow')
      assert(PageContainerContentChild.childAt(1).is(SendAmountRow), 'row[2] should be SendAmountRow')
      assert(PageContainerContentChild.childAt(2).is(SendGasRow), 'row[3] should be SendGasRow')
      assert.equal(PageContainerContentChild.childAt(3).exists(), false)
    })
  })

  it('should not render the asset dropdown if token length is 0 ', () => {
    wrapper.setProps({ tokens: [] })
    const PageContainerContentChild = wrapper.find(PageContainerContent).children()
    assert(PageContainerContentChild.childAt(1).is(SendAssetRow))
    assert(PageContainerContentChild.childAt(1).find('send-v2__asset-dropdown__single-asset'), true)
  })
})
