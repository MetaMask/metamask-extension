import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import configureMockStore from 'redux-mock-store'
import { mountWithRouter, stubComponent } from '../../../../../test/lib/render-helpers'
import UnlockPage from '../index'
import Mascot from '../../../components/ui/mascot'

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

  const mockStore = {
    metamask: {},
  }

  const store = configureMockStore()(mockStore)

  stubComponent(Mascot)

  beforeEach(() => {
    wrapper = mountWithRouter(
      <UnlockPage.WrappedComponent {...props} />, store
    )

  })

  it('renders', () => {
    assert.equal(wrapper.length, 1)
  })

  it('changes password and submits', () => {
    const passwordField = wrapper.find({ type: 'password', id: 'password' })
    const loginButton = wrapper.find({ type: 'submit' }).last()

    const event = { target: { value: 'password' } }

    assert.equal(wrapper.state().password, '')
    passwordField.last().simulate('change', event)
    assert.equal(wrapper.state().password, 'password')

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
