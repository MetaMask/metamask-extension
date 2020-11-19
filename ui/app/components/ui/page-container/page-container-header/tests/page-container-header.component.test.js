import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import PageContainerHeader from '../page-container-header.component'

describe('Page Container Header', function () {
  let wrapper, style, onBackButtonClick, onClose

  beforeEach(function () {
    style = { test: 'style' }
    onBackButtonClick = sinon.spy()
    onClose = sinon.spy()

    wrapper = shallow(
      <PageContainerHeader
        showBackButton
        onBackButtonClick={onBackButtonClick}
        backButtonStyles={style}
        title="Test Title"
        subtitle="Test Subtitle"
        tabs="Test Tab"
        onClose={onClose}
      />,
    )
  })

  describe('Render Header Row', function () {
    it('renders back button', function () {
      assert.equal(wrapper.find('.page-container__back-button').length, 1)
      assert.equal(wrapper.find('.page-container__back-button').text(), 'Back')
    })

    it('ensures style prop', function () {
      assert.equal(
        wrapper.find('.page-container__back-button').props().style,
        style,
      )
    })

    it('should call back button when click is simulated', function () {
      wrapper.find('.page-container__back-button').prop('onClick')()
      assert.equal(onBackButtonClick.callCount, 1)
    })
  })

  describe('Render', function () {
    let header, headerRow, pageTitle, pageSubtitle, pageClose, pageTab

    beforeEach(function () {
      header = wrapper.find('.page-container__header--no-padding-bottom')
      headerRow = wrapper.find('.page-container__header-row')
      pageTitle = wrapper.find('.page-container__title')
      pageSubtitle = wrapper.find('.page-container__subtitle')
      pageClose = wrapper.find('.page-container__header-close')
      pageTab = wrapper.find('.page-container__tabs')
    })

    it('renders page container', function () {
      assert.equal(header.length, 1)
      assert.equal(headerRow.length, 1)
      assert.equal(pageTitle.length, 1)
      assert.equal(pageSubtitle.length, 1)
      assert.equal(pageClose.length, 1)
      assert.equal(pageTab.length, 1)
    })

    it('renders title', function () {
      assert.equal(pageTitle.text(), 'Test Title')
    })

    it('renders subtitle', function () {
      assert.equal(pageSubtitle.text(), 'Test Subtitle')
    })

    it('renders tabs', function () {
      assert.equal(pageTab.text(), 'Test Tab')
    })

    it('should call close when click is simulated', function () {
      pageClose.prop('onClick')()
      assert.equal(onClose.callCount, 1)
    })
  })
})
