import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import {
  INITIALIZE_SEED_PHRASE_ROUTE,
  INITIALIZE_SELECT_ACTION_ROUTE,
} from '../../../../../helpers/constants/routes'
import NewAccount from '../index'

describe('First Time Flow New Account', function () {

  let wrapper

  const props = {
    onSubmit: sinon.spy(),
    history: {
      push: sinon.spy(),
    },
  }

  beforeEach(function () {
    wrapper = mount(
      <NewAccount {...props} />, {
        context: {
          t: (str) => str,
          metricsEvent: () => {},
        },
      }
    )
  })

  afterEach(function () {
    props.history.push.resetHistory()
    props.onSubmit.resetHistory()
  })

  after(function () {
    sinon.restore()
  })

  it('navigates to select route when back button is clicked', function () {
    const backButton = wrapper.find('.first-time-flow__create-back>a')
    backButton.simulate('click')

    assert.equal(props.history.push.getCall(0).args[0], INITIALIZE_SELECT_ACTION_ROUTE)
  })

  it('errors when a password is too short', function () {
    const passwordInput = wrapper.find('input#create-password')

    const testPass = '2short'
    const event = { target: { value: testPass } }

    passwordInput.simulate('change', event)

    assert.equal(wrapper.state('passwordError'), 'passwordNotLongEnough')
  })

  it('errors when confirm password is not the same as created password', function () {
    const passwordInput = wrapper.find('input#create-password')
    const confirmpassword = wrapper.find('input#confirm-password')

    const testPass = 'test-password'
    const wrongPass = 'password-test'

    const passwordEvent = { target: { value: testPass } }
    const confirmPassEvent = { target: { value: wrongPass } }

    passwordInput.simulate('change', passwordEvent)
    confirmpassword.simulate('change', confirmPassEvent)

    assert.equal(wrapper.state('confirmPasswordError'), 'passwordsDontMatch')
  })

  it('call onSubmit with password when clicked, requires password, confirm password, and TOS is checked', function () {
    const passwordInput = wrapper.find('input#create-password')
    const confirmpassword = wrapper.find('input#confirm-password')
    const checkBox = wrapper.find('.first-time-flow__checkbox-container')
    const createPassword = wrapper.find('.button.first-time-flow__button')

    const testPass = 'test-password'
    const wrongPass = 'test-password'

    const passwordEvent = { target: { value: testPass } }
    const confirmPassEvent = { target: { value: wrongPass } }

    passwordInput.simulate('change', passwordEvent)
    confirmpassword.simulate('change', confirmPassEvent)

    checkBox.simulate('click')
    createPassword.simulate('click')

    setImmediate(() => {
      assert.equal(props.onSubmit.getCall(0).args[0], testPass)
      assert.equal(props.history.push.getCall(0).args[0], INITIALIZE_SEED_PHRASE_ROUTE)
    })
  })

  it('keypress on checkbox to toggle TOS check', function () {
    const checkBox = wrapper.find('.first-time-flow__checkbox')

    assert.equal(wrapper.state('termsChecked'), false)

    checkBox.simulate('keypress', { key: 'Enter' })

    assert.equal(wrapper.state('termsChecked'), true)
  })
})
