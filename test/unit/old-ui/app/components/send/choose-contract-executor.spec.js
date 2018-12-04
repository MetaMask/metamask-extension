import React from 'react'
import assert from 'assert'
import ChooseContractExecutor from '../../../../../../old-ui/app/components/send/choose-contract-executor'
import { mount } from 'enzyme'
import thunk from 'redux-thunk'
import configureMockStore from 'redux-mock-store'
import { Provider } from 'react-redux'

describe('ChooseContractExecutor component', () => {
	describe('render() function', () => {
		const state = {
			metamask: {
				selectedAddress: '0x99a22ce737b6a48f44cad6331432ce98693cad07',
				accounts: ['0x99a22ce737b6a48f44cad6331432ce98693cad07'],
				keyrings: [
					{
						'type': 'HD Key Tree',
						'accounts': [
							'0x99a22ce737b6a48f44cad6331432ce98693cad07',
						],
					},
				],
				identities: {
					'0x99a22ce737b6a48f44cad6331432ce98693cad07': {
						name: 'Account 1',
						address: '0x99a22ce737b6a48f44cad6331432ce98693cad07',
					},
				},
				txParams: {},
				methodSelected: '',
				methodABI: [],
				inputValues: [],
			},
			appState: {},
		}

		const middlewares = [thunk]
		const mockStore = configureMockStore(middlewares)
		const store = mockStore(state)
		let wrapper

		beforeEach(function () {
			wrapper = mount(
				<Provider store={store}>
					<ChooseContractExecutor
						methodSelected={false}
						methodABI={[]}
						inputValues={[]}
						txParams={{}}
					/>
				</Provider>
			)
		})

		it('shows correct title', () => {
			assert.equal(wrapper.find('.send-header').text(), 'Choose contract executor')
		})

		it('shows correct profile', () => {
			assert.equal(wrapper.find('.send-profile-identity-name').text(), 'Account 1')
			assert.equal(wrapper.find('.send-profile-address').text(), '0x99a22cE7...Ad07')
		})

		it('doesn\'t show error', () => {
			assert.equal(wrapper.find('.error').exists(), false)
		})

		it('shows correct description', () => {
			assert.equal(wrapper.find('.hw-connect__header__msg').text(), 'contract transaction will be executed from selected account')
		})

		it('shows Next button', () => {
			assert.equal(wrapper.find('.choose-contract-next-button').text(), 'Next')
		})

		it('the number of accounts is equal to number of keyrings', () => {
			assert.equal(wrapper.find('.executor-cell-container').length, state.metamask.keyrings.length)
		})
	})
})
