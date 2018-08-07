import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import ConfirmDetailRow from '../confirm-detail-row.component.js'
import sinon from 'sinon'

const propsMethodSpies = {
  onHeaderClick: sinon.spy(),
}

describe('Confirm Detail Row Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<ConfirmDetailRow
      errorType={'mockErrorType'}
      label={'mockLabel'}
      showError={false}
      fiatText = {'mockFiatText'}
      ethText = {'mockEthText'}
      fiatTextColor= {'mockColor'}
      onHeaderClick= {propsMethodSpies.onHeaderClick}
      headerText = {'mockHeaderText'}
      headerTextClassName = {'mockHeaderClass'}
    />)
  })

	describe('render', () => {
    it('should render a div with a confirm-detail-row class', () => {
      assert.equal(wrapper.find('div.confirm-detail-row').length, 1)
    })

    it('should render the label as a child of the confirm-detail-row__label', () => {
      assert.equal(wrapper.find('.confirm-detail-row > .confirm-detail-row__label').childAt(0).text(), 'mockLabel')
    })

    it('should render the headerText as a child of the confirm-detail-row__header-text', () => {
      assert.equal(wrapper.find('.confirm-detail-row__details > .confirm-detail-row__header-text').childAt(0).text(), 'mockHeaderText')
    })

    it('should render the fiatText as a child of the confirm-detail-row__fiat', () => {
      assert.equal(wrapper.find('.confirm-detail-row__details > .confirm-detail-row__fiat').childAt(0).text(), 'mockFiatText')
    })

    it('should render the ethText as a child of the confirm-detail-row__eth', () => {
      assert.equal(wrapper.find('.confirm-detail-row__details > .confirm-detail-row__eth').childAt(0).text(), 'mockEthText')
    })

    it('should set the fiatTextColor on confirm-detail-row__fiat', () => {
      assert.equal(wrapper.find('.confirm-detail-row__fiat').props().style.color, 'mockColor')
    })

    it('should assure the confirm-detail-row__header-text classname is correct', () => {
      assert.equal(wrapper.find('.confirm-detail-row__header-text').props().className, 'confirm-detail-row__header-text mockHeaderClass')
    })

    it('should call onHeaderClick when headerText div gets clicked', () => {
      wrapper.find('.confirm-detail-row__header-text').props().onClick()
      assert.equal(assert.equal(propsMethodSpies.onHeaderClick.callCount, 1))
    })


	})
})
