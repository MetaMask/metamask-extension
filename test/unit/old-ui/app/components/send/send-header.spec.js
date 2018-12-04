import React from 'react'
import assert from 'assert'
import SendHeader from '../../../../../../old-ui/app/components/send/send-header'
import { mount } from 'enzyme'
import thunk from 'redux-thunk'
import configureMockStore from 'redux-mock-store'
import { Provider } from 'react-redux'

describe('SendHeader component', () => {
	describe('render() function', () => {
		const state = {
			metamask: {},
			appState: {},
		}

		const middlewares = [thunk]
		const mockStore = configureMockStore(middlewares)
		const store = mockStore(state)
		let wrapper

		beforeEach(function () {
			wrapper = mount(
				<Provider store={store}>
					<SendHeader
						title={'Execute Method'}
					/>
				</Provider>
			)
		})
		it('renders correct title', () => {
			assert.equal(wrapper.find('.send-header').text(), 'Execute Method')
		})
	})
})
