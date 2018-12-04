import React from 'react'
import assert from 'assert'
import SendContractError from '../../../../../../old-ui/app/components/send/send-error'
import { mount } from 'enzyme'
import thunk from 'redux-thunk'
import configureMockStore from 'redux-mock-store'
import { Provider } from 'react-redux'

const state = {
	metamask: {},
	appState: {},
}

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)
const store = mockStore(state)
let wrapper

describe('SendContractError component', () => {
	describe('renders SendContractError component', () => {
		beforeEach(function () {
			wrapper = mount(
				<Provider store={store}>
					<SendContractError error="Error!"/>
				</Provider>
			)
		})
		it('shows error', () => {
			assert.equal(wrapper.find('.error').text(), 'Error!')
		})
	})

	describe('doesn\'t render SendContractError component', () => {
		beforeEach(function () {
			wrapper = mount(
				<Provider store={store}>
					<SendContractError/>
				</Provider>
			)
		})

		it('doesn\'t show error', () => {
			assert.equal(wrapper.find('.error').isEmpty(), true)
		})
	})
})
