import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import UnlockPage from '../index'

describe('Unlock Page', () => {
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


  beforeEach(() => {

    wrapper = mount(
      <UnlockPage.WrappedComponent{...props} />, {
        context: {
          t: str => str,
        },
      }
    )

  })

  after(() => {
    sinon.restore()
  })

  it('renders', () => {
    assert.equal(wrapper.length, 1)
  })

  it('changes password and submits', () => {
    const passwordField = wrapper.find({ type: 'password', id: 'password' })
    const loginButton = wrapper.find({ type: 'submit' }).last()

    const event = { target: { value: 'password' } }
    assert.equal(wrapper.instance().state.password, '')
    passwordField.last().simulate('change', event)
    assert.equal(wrapper.instance().state.password, 'password')

    loginButton.simulate('click')
    assert(props.onSubmit.calledOnce)
  })

  it('clicks imports seed button', () => {
    const importSeedButton = wrapper.find('.unlock-page__link--import')

    importSeedButton.simulate('click')
    assert(props.onImport.calledOnce)

  })

  it('clicks restore', () => {
    const restoreFromSeedButton = wrapper.find('.unlock-page__link').at(0)
    restoreFromSeedButton.simulate('click')
    assert(props.onRestore.calledOnce)
  })
})
