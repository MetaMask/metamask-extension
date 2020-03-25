import React from 'react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import assert from 'assert'
import sinon from 'sinon'
import { mountWithRouter } from '../../../../../../../test/lib/render-helpers'
import EditContact from '../edit-contact.component'

describe('EditContact', function () {
  let wrapper

  const defaultAddress = '0xeb9e64b93097bc15f01f13eae97015c57ab64823'

  const nickname = 'username'
  const address = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b'
  const memo = 'a new memo'

  const mockState = {
    metamask: {},
  }

  const store = configureStore()(mockState)

  const props = {
    address: defaultAddress,
    history: {
      push: sinon.spy(),
    },
    removeFromAddressBook: sinon.stub(),
    addToAddressBook: sinon.stub(),
    setAccountLabel: sinon.stub(),
  }

  beforeEach(function () {
    wrapper = mountWithRouter(
      <Provider store={store}>
        <EditContact {...props} />,
      </Provider>
    )
  })

  afterEach(function () {
    props.removeFromAddressBook.resetHistory()
    props.addToAddressBook.resetHistory()
    props.setAccountLabel.resetHistory()
    props.history.push.resetHistory()
  })

  after(function () {
    sinon.restore()
  })

  it('deletes address from addressbook', function () {
    const backButton = wrapper.find('.settings-page__address-book-button').last()

    backButton.simulate('click')

    assert(props.removeFromAddressBook.calledOnce)
    assert(props.history.push.calledOnce)

  })

  it('changes newName in state on nickname input change', function () {
    const usernameInput = wrapper.find({ id: 'nickname' }).last()

    const event = { target: { value: nickname } }
    usernameInput.simulate('change', event)

    assert.equal(wrapper.find('EditContact').state('newName'), nickname)
  })

  it('changes newAddress in state on address input change', function () {
    const addressInput = wrapper.find({ id: 'address' }).last()

    const event = { target: { value: address } }
    addressInput.simulate('change', event)

    assert(wrapper.find('EditContact').state('newAddress'), address)
  })

  it('changes newMemo in state on memo input change', function () {
    const memoInput = wrapper.find({ id: 'memo' }).last()

    const event = { target: { value: memo } }
    memoInput.simulate('change', event)

    assert.equal(wrapper.find('EditContact').state('newMemo'), memo)
  })

  it('submits invalid address', function () {
    const addressInput = wrapper.find({ id: 'address' }).last()

    const event = { target: { value: '0xAddress' } }
    addressInput.simulate('change', event)

    const submitButton = wrapper.find('.btn-primary.page-container__footer-button')
    submitButton.simulate('click')

    assert.equal(wrapper.find('EditContact').state('error'), 'invalidAddress')
  })

  it('submits nickname and memo change without address change', function () {
    const usernameInput = wrapper.find({ id: 'nickname' }).last()
    const memoInput = wrapper.find({ id: 'memo' }).last()

    const usernameEvent = { target: { value: nickname } }
    const memoEvent = { target: { value: memo } }

    usernameInput.simulate('change', usernameEvent)
    memoInput.simulate('change', memoEvent)

    const submitButton = wrapper.find('.btn-primary.page-container__footer-button')
    submitButton.simulate('click')

    assert.deepEqual(
      props.addToAddressBook.getCall(0).args,
      [defaultAddress, nickname, memo]
    )
    assert(props.setAccountLabel.calledOnce)
  })

  it('submits', function () {
    const usernameInput = wrapper.find({ id: 'nickname' }).last()
    const addressInput = wrapper.find({ id: 'address' }).last()
    const memoInput = wrapper.find({ id: 'memo' }).last()

    const usernameEvent = { target: { value: nickname } }
    const addressEvent = { target: { value: address } }
    const memoEvent = { target: { value: memo } }

    usernameInput.simulate('change', usernameEvent)
    addressInput.simulate('change', addressEvent)
    memoInput.simulate('change', memoEvent)

    const submitButton = wrapper.find('.btn-primary.page-container__footer-button')
    submitButton.simulate('click')

    assert(props.removeFromAddressBook.calledOnce)
    assert(props.addToAddressBook.calledOnce)

    assert.deepEqual(props.addToAddressBook.getCall(0).args,
      [address, nickname, memo]
    )

    assert(props.setAccountLabel.calledOnce)
  })

  it('cancels', function () {

    const cancelButton = wrapper.find({ type: 'default' })
    cancelButton.simulate('click')
    assert(props.history.push.calledOnce)
  })
})
