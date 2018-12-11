import React from 'react'
import assert from 'assert'
import ExecutorCell from '../../../../../../old-ui/app/components/send/executor-cell'
import Identicon from '../../../../../../old-ui/app/components/identicon'
import { mount } from 'enzyme'
import thunk from 'redux-thunk'
import configureMockStore from 'redux-mock-store'
import { Provider } from 'react-redux'

describe('ExecutorCell component', () => {
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
					<ExecutorCell
						isAccountSelected={false}
						address={'0x99a22ce737b6a48f44cad6331432ce98693cad07'}
						identity={{
							name: 'Account 1',
							address: '0x99a22ce737b6a48f44cad6331432ce98693cad07',
						}}
						onClick={() => {}}
					/>
				</Provider>
			)
		})

		it('renders Identicon', () => {
			assert.equal(wrapper.find(Identicon).prop('address'), '0x99a22ce737b6a48f44cad6331432ce98693cad07')
			assert.equal(wrapper.find(Identicon).prop('network'), undefined)
		})

		it('renders correct identity name', () => {
			assert.equal(wrapper.find('.font-medium.flex-center').text(), 'Account 1')
		})

		it('renders correct compressed address', () => {
			assert.equal(wrapper.find('.flex-row.flex-center').text(), '0x99a22cE7...Ad07')
		})

		it('changes class on click', () => {
			assert.equal(wrapper.find('.executor-cell-container').exists(), true)
			assert.equal(wrapper.find('.executor-cell-container-selected').exists(), false)
			wrapper.find('.executor-cell-container').simulate('click')
			assert.equal(wrapper.find('.executor-cell-container').exists(), false)
			assert.equal(wrapper.find('.executor-cell-container-selected').exists(), true)
		})
	})
})
