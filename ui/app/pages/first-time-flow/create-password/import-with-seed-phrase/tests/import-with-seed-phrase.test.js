import React from 'react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import assert from 'assert'
import sinon from 'sinon'
import { mountWithRouter } from '../../../../../../../test/lib/render-helpers'

import {
  INITIALIZE_SELECT_ACTION_ROUTE,
} from '../../../../../helpers/constants/routes'
import ImportWithSeedPhrase from '../index'

describe('ImportWithSeedPhrase', function () {
  let wrapper

  const mockStore = {
    metamask: {},
  }

  const TEST_SEED = 'debris dizzy just program just float decrease vacant alarm reduce speak stadium'
  const INVALID_TEST_SEED = 'debris dizzy just program just float decrease vacant alarm reduce speak active'

  const store = configureStore()(mockStore)

  const props = {
    setSeedPhraseBackedUp: sinon.stub().resolves(),
    onSubmit: sinon.stub().resolves(),
    history: {
      push: sinon.spy(),
    },
  }

  beforeEach(function () {
    wrapper = mountWithRouter(
      <Provider store={store} >
        <ImportWithSeedPhrase {...props} />
      </Provider>
    )
  })

  afterEach(function () {
    props.history.push.resetHistory()
  })

  after(function () {
    sinon.restore()
  })

  it('renders', function () {
    assert.equal(wrapper.length, 1)
  })

  it('back button', function () {
    const backbutton = wrapper.find('.first-time-flow__create-back a')

    backbutton.simulate('click')

    assert(props.history.push.calledOnce)
    assert.equal(props.history.push.getCall(0).args[0], INITIALIZE_SELECT_ACTION_ROUTE)
  })

  it('errors with seed phrase length error', function () {
    const textArea = wrapper.find('.first-time-flow__textarea')

    const event = { target: { value: 'new seed phrase' } }
    textArea.simulate('change', event)

    assert.equal(wrapper.find('.error').text(), 'seedPhraseReq')
    assert.equal(wrapper.find('ImportWithSeedPhrase').state('seedPhraseError'), 'seedPhraseReq')
  })

  it('errors with invalid seed phrase', function () {
    const textArea = wrapper.find('.first-time-flow__textarea')

    const event = { target: { value: INVALID_TEST_SEED } }
    textArea.simulate('change', event)

    assert.equal(wrapper.find('.error').text(), 'invalidSeedPhrase')
    assert.equal(wrapper.find('ImportWithSeedPhrase').state('seedPhraseError'), 'invalidSeedPhrase')
  })

  it('errors with short password', function () {
    const password = wrapper.find({ type: 'password', id: 'password' }).last()

    const event = { target: { value: 'short' } }
    password.simulate('change', event)

    assert.equal(wrapper.find('ImportWithSeedPhrase').state('passwordError'), 'passwordNotLongEnough')
  })

  it('errors when password and confirm-password do not match', function () {
    const password = wrapper.find({ type: 'password', id: 'password' }).last()
    const confirmPassword = wrapper.find({ type: 'password', id: 'confirm-password' }).last()

    const event = { target: { value: 'password' } }
    const wrongEvent = { target: { value: 'confirm-password' } }

    password.simulate('change', event)
    confirmPassword.simulate('change', wrongEvent)

    assert.equal(wrapper.find('ImportWithSeedPhrase').state('confirmPasswordError'), 'passwordsDontMatch')
  })

  it('errors when confirm-password and password do not match', function () {
    const password = wrapper.find({ type: 'password', id: 'password' }).last()
    const confirmPassword = wrapper.find({ type: 'password', id: 'confirm-password' }).last()

    const event = { target: { value: 'password' } }
    const wrongEvent = { target: { value: 'confirm-password' } }

    confirmPassword.simulate('change', wrongEvent)
    password.simulate('change', event)

    assert.equal(wrapper.find('ImportWithSeedPhrase').state('confirmPasswordError'), 'passwordsDontMatch')
  })

  it('calls onSubmit with password and seed phrase when password is verified', function () {
    const textArea = wrapper.find('.first-time-flow__textarea')
    const password = wrapper.find({ type: 'password', id: 'password' }).last()
    const confirmPassword = wrapper.find({ type: 'password', id: 'confirm-password' }).last()
    const terms = wrapper.find('.first-time-flow__checkbox-container')

    const passwordText = 'a-password'
    const seedEvent = { target: { value: TEST_SEED } }
    const event = { target: { value: passwordText } }

    textArea.simulate('change', seedEvent)
    password.simulate('change', event)
    confirmPassword.simulate('change', event)
    terms.simulate('click')

    const importButton = wrapper.find('.btn-primary.first-time-flow__button')
    importButton.simulate('submit')

    assert(props.onSubmit.calledOnce)
    assert.deepEqual(
      props.onSubmit.getCall(0).args,
      [passwordText, TEST_SEED]
    )
  })
})
