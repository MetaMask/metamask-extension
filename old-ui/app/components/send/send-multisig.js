import React from 'react'
import { connect } from 'react-redux'
import PersistentForm from '../../../lib/persistent-form'
import { numericBalance } from '../../util'
import SendProfile from './send-profile'
import SendHeader from './send-header'
import SendError from './send-error'
import Select from 'react-select'

class SendTransactionScreen extends PersistentForm {
	constructor (props) {
		super(props)
		this.state = {
			options: [],
			methodSelected: '',
		}
		PersistentForm.call(this)
	}

	componentWillMount () {
		this.getContractMethods()
	}

	render () {
		this.persistentFormParentId = 'send-multisig-tx-form'

		const props = this.props
		const {
			address,
			account,
			identity,
			network,
			identities,
			addressBook,
			conversionRate,
			currentCurrency,
			error,
		} = props
		return (
			<div className="send-screen flex-column flex-grow">
				<SendProfile />
				<SendHeader title="Execute Method" />
				<SendError error={error} />
				<div style={{ margin: '0 30px' }}>
					<Select
						clearable={false}
						value={this.state.methodSelected}
						options={this.state.options}
						onChange={(opt) => {
							this.setState({ methodSelected: opt.value })
						}}
					/>
				</div>
			</div>
		)
	}

	getContractMethods () {
		console.log('###getContractMethods')
		console.log(this.props)
		const apiLink = `https://api.etherscan.io/api?module=contract&action=getabi&address=${this.props.address}&apikey=`
		fetch(apiLink)
		.then(res => res.json())
		.then(json => {
			console.log(json)
			const abiString = json && json.result
			const abi = JSON.parse(abiString)
			console.log(abi)
			const options = abi.map((obj) => {
				if (abi.type === 'function') {
					return { label: abi.name, value: abi.name }
				}
				console.log(obj)
			})
			this.setState({
				options,
			})
		})
	}
}

function mapStateToProps (state) {
	var result = {
	address: state.metamask.selectedAddress,
	accounts: state.metamask.accounts,
	identities: state.metamask.identities,
	warning: state.appState.warning,
	network: state.metamask.network,
	addressBook: state.metamask.addressBook,
	conversionRate: state.metamask.conversionRate,
	currentCurrency: state.metamask.currentCurrency,
	}

	result.error = result.warning && result.warning.split('.')[0]

	result.account = result.accounts[result.address]
	result.identity = result.identities[result.address]
	result.balance = result.account ? numericBalance(result.account.balance) : null

	return result
}

module.exports = connect(mapStateToProps, null)(SendTransactionScreen)
