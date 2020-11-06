import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'
import UnlockPage from '..'

describe('Unlock Page', function () {
  let wrapper

  const props = {
    history: {
      push: sinon.spy(),
    },
    isUnlocked: false,
    onImport: sinon.spy(),
    onRestore: sinon.spy(),
    onSubmit: sinon.spy(),
    forceUpdateMetamaskState: sinon.spy(),
    showOptInModal: sinon.spy(),
  }

  beforeEach(function () {
    wrapper = mount(<UnlockPage.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    })
  })

  after(function () {
    sinon.restore()
  })

  it('renders', function () {
    assert.equal(wrapper.length, 1)
  })

  it('changes password and submits', function () {
    const passwordField = wrapper.find({ type: 'password', id: 'password' })
    const loginButton = wrapper.find({ type: 'submit' }).last()

    const event = { target: { value: 'password' } }
    assert.equal(wrapper.instance().state.password, '')
    passwordField.last().simulate('change', event)
    assert.equal(wrapper.instance().state.password, 'password')

    loginButton.simulate('click')
    assert(props.onSubmit.calledOnce)
  })

  it('clicks imports seed button', function () {
    const importSeedButton = wrapper.find('.unlock-page__link--import')

    importSeedButton.simulate('click')
    assert(props.onImport.calledOnce)
  })

  it('clicks restore', function () {
    const restoreFromSeedButton = wrapper.find('.unlock-page__link').at(0)
    restoreFromSeedButton.simulate('click')
    assert(props.onRestore.calledOnce)
  })
})
