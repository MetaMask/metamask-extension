import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'

import PageContainer from '../page-container-content.component'

describe('Page Container', () => {
  let wrapper

  const props = {
    title: 'Title',
    subtitle: 'Subtitle',
    onClose: sinon.spy(),
    showBackButton: true,
    onBackButtonClick: sinon.spy(),
    backButtonString: 'Back Button',
    onCancel: sinon.spy(),
    cancelText: 'Cancel',
    onSubmit: sinon.spy(),
    submitText: 'Submit',
    headerCloseText: 'Header Close',
    hideCancel: false,
    tabsComponent: '', // component
    contentComponent: '', // component
  }

  beforeEach(() => {
    wrapper = mount(<PageContainer {...props} />)
  })

  it('render', () => {
    assert.equal(wrapper.length, 1)
  })
})
