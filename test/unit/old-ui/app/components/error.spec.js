import React from 'react'
import assert from 'assert'
import ErrorComponent from '../../../../../old-ui/app/components/error'
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

describe('ErrorComponent', () => {
	describe('renders ErrorComponent', () => {
		beforeEach(function () {
			wrapper = mount(
				<Provider store={store}>
					<ErrorComponent error="Error!"/>
				</Provider>
			)
		})
		it('shows error', () => {
			assert.equal(wrapper.find('.error').text(), 'Error!')
		})
	})

	describe('doesn\'t render ErrorComponent component', () => {
		beforeEach(function () {
			wrapper = mount(
				<Provider store={store}>
					<ErrorComponent/>
				</Provider>
			)
		})

		it('doesn\'t show error', () => {
			assert.equal(wrapper.find('.error').isEmpty(), true)
		})
	})
})
