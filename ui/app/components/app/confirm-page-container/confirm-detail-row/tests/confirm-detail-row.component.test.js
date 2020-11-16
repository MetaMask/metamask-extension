import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import ConfirmDetailRow from '../confirm-detail-row.component'

const propsMethodSpies = {
  onHeaderClick: sinon.spy(),
}

describe('Confirm Detail Row Component', function () {
  describe('render', function () {
    let wrapper

    beforeEach(function () {
      wrapper = shallow(
        <ConfirmDetailRow
          errorType="mockErrorType"
          label="mockLabel"
          showError={false}
          primaryText="mockFiatText"
          secondaryText="mockEthText"
          primaryValueTextColor="mockColor"
          onHeaderClick={propsMethodSpies.onHeaderClick}
          headerText="mockHeaderText"
          headerTextClassName="mockHeaderClass"
        />,
      )
    })

    it('should render a div with a confirm-detail-row class', function () {
      assert.equal(wrapper.find('div.confirm-detail-row').length, 1)
    })

    it('should render the label as a child of the confirm-detail-row__label', function () {
      assert.equal(
        wrapper
          .find('.confirm-detail-row > .confirm-detail-row__label')
          .childAt(0)
          .text(),
        'mockLabel',
      )
    })

    it('should render the headerText as a child of the confirm-detail-row__header-text', function () {
      assert.equal(
        wrapper
          .find(
            '.confirm-detail-row__details > .confirm-detail-row__header-text',
          )
          .childAt(0)
          .text(),
        'mockHeaderText',
      )
    })

    it('should render the primaryText as a child of the confirm-detail-row__primary', function () {
      assert.equal(
        wrapper
          .find('.confirm-detail-row__details > .confirm-detail-row__primary')
          .childAt(0)
          .text(),
        'mockFiatText',
      )
    })

    it('should render the ethText as a child of the confirm-detail-row__secondary', function () {
      assert.equal(
        wrapper
          .find('.confirm-detail-row__details > .confirm-detail-row__secondary')
          .childAt(0)
          .text(),
        'mockEthText',
      )
    })

    it('should set the fiatTextColor on confirm-detail-row__primary', function () {
      assert.equal(
        wrapper.find('.confirm-detail-row__primary').props().style.color,
        'mockColor',
      )
    })

    it('should assure the confirm-detail-row__header-text classname is correct', function () {
      assert.equal(
        wrapper.find('.confirm-detail-row__header-text').props().className,
        'confirm-detail-row__header-text mockHeaderClass',
      )
    })

    it('should call onHeaderClick when headerText div gets clicked', function () {
      wrapper.find('.confirm-detail-row__header-text').props().onClick()
      assert.ok(propsMethodSpies.onHeaderClick.calledOnce)
    })
  })
})
