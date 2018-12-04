import React from 'react'
import assert from 'assert'
import SendError from '../../../../../../old-ui/app/components/send/send-error'
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

describe('SendError component', () => {
	describe('renders SendError component', () => {
		beforeEach(function () {
			wrapper = mount(
				<Provider store={store}>
					<SendError error="Error!"/>
				</Provider>
			)
		})
		it('shows error', () => {
			assert.equal(wrapper.find('.error').text(), 'Error!')
		})
	})

	describe('doesn\'t render SendError component', () => {
		beforeEach(function () {
			wrapper = mount(
				<Provider store={store}>
					<SendError/>
				</Provider>
			)
		})

		it('doesn\'t show error', () => {
			assert.equal(wrapper.find('.error').isEmpty(), true)
		})
	})
})
