import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import SendProfile from './send-profile'
import ExecutorCell from './executor-cell'
import SendHeader from './send-header'
import SendError from './send-error'
import actions from '../../../../ui/app/actions'
import { ifContractAcc } from '../../util'
import Web3 from 'web3'

const ownerABI = [{
	'constant': true,
	'inputs': [],
	'name': 'owner',
	'outputs': [
		{
			'name': '',
			'type': 'address',
		},
	],
	'payable': false,
	'type': 'function',
	'stateMutability': 'view',
}]

const getOwnersABI = [{
	'constant': true,
	'inputs': [],
	'name': 'getOwners',
	'outputs': [
		{
			'name': '',
			'type': 'address[]',
		},
	],
	'payable': false,
	'type': 'function',
	'stateMutability': 'view',
}]

class ChooseContractExecutor extends Component {
	constructor (props) {
		super(props)
		this.state = {
			web3: new Web3(global.ethereumProvider),
			selectedExecutor: '',
			accountsCells: [],
			owners: [],
			nextDisabled: true,
		}
	}

	static propTypes = {
		methodSelected: PropTypes.string,
		methodABI: PropTypes.object,
		inputValues: PropTypes.object,
		hideWarning: PropTypes.func,
		signTx: PropTypes.func,
		setSelectedAddress: PropTypes.func,
		showSendContractPage: PropTypes.func,
		txParams: PropTypes.object,
		identities: PropTypes.object,
		keyrings: PropTypes.array,
		error: PropTypes.string,
		showLoadingIndication: PropTypes.func,
		hideLoadingIndication: PropTypes.func,
	}

	render () {
		const { error } = this.props
		return (
			<div className="send-screen flex-column flex-grow">
				<SendProfile />
				<SendHeader title="Choose contract executor" back={() => this.back()} />
				<SendError
					error={error}
					onClose={() => {
						this.props.hideWarning()
					}}
				/>
				<div style={{ padding: '0 30px' }}>
					<span className="hw-connect__header__msg">Contract transaction will be executed from selected account</span>
				</div>
				<div style={{
					padding: '0 30px',
					maxHeight: '220px',
					overflow: 'auto',
				}}>
					{this.state.accountsCells}
				</div>
				<div style={{ padding: '0 30px' }}>
					{this.buttonsSection()}
				</div>
			</div>
		)
	}

	componentDidMount = async () => {
		await this.getAllOwners()
		this.generateListOfAccounts()
	}

	buttonsSection () {
		const nextButton = (
			<button
				disabled={this.state.nextDisabled}
				className="choose-contract-next-button"
				onClick={() => this.onSubmit() }
			>
				Next
			</button>
		)

		const buttonContainer = (
			<div
				className="section flex-row flex-right"
				style={{ margin: '20px 0' }}
			>
				{ nextButton }
			</div>
		)

		return buttonContainer
	}

	generateListOfAccounts = () => {
		const { keyrings, identities } = this.props
		const accountsCells = []
		keyrings.forEach((keyring) => {
			if (!ifContractAcc(keyring)) {
				keyring.accounts.forEach((address) => {
					const identity = identities[address]
					const executorCell = <ExecutorCell
						key={Math.random()}
						address={address}
						identity={identity}
						isAccountSelected={this.isAccountSelected(address)}
						onClick={(e, isSelected) => this.selectExecutor(e, isSelected, address)}
					/>
					if (this.state.owners.includes(address)) {
						accountsCells.unshift(executorCell)
					} else {
						accountsCells.push(executorCell)
					}
				})
			}
		})

		this.setState({
			accountsCells,
		})
	}

	getAllOwners = () => {
		this.props.showLoadingIndication()
		return new Promise((resolve) => {
			Promise.all([this.getOwner(), this.getOwners()])
			.then(([owner, owners]) => {
				if (!owners) {
					owners = []
				}
				if (owner !== '0x' && !owners.includes(owner)) {
					owners.push(owner)
				}
				this.setState({ owners })
				this.props.hideLoadingIndication()
				resolve()
			})
			.catch(_ => {
				this.props.hideLoadingIndication()
				resolve()
			})
		})
	}

	getOwner = () => {
		return this.getOwnersCommon('owner', ownerABI)
	}

	getOwners = () => {
		return this.getOwnersCommon('getOwners', getOwnersABI)
	}

	getOwnersCommon = (method, abi) => {
		const { web3 } = this.state
		const { txParams } = this.props

		return new Promise((resolve) => {
			try {
				web3.eth.contract(abi).at(txParams.to)[method].call((err, output) => {
					resolve(output)
				})
			} catch (e) {
				resolve('')
			}
		})
	}

	componentDidUpdate (prevProps, prevState) {
		if (prevState.selectedExecutor !== this.state.selectedExecutor) {
			this.generateListOfAccounts()
		}
	}

	onSubmit = () => {
		const { txParams } = this.props
		const { selectedExecutor } = this.state
		this.props.setSelectedAddress(selectedExecutor)
		txParams.from = selectedExecutor
		txParams.isContractExecutionByUser = true
		this.props.signTx(txParams)
	}

	selectExecutor (e, isSelected, address) {
		if (isSelected) {
			this.setState({
				selectedExecutor: address,
				nextDisabled: false,
			})
		} else {
			this.setState({
				selectedExecutor: '',
				nextDisabled: true,
			})
		}
	}

	isAccountSelected (address) {
		return address === this.state.selectedExecutor
	}

	back () {
		const { methodSelected, methodABI, inputValues } = this.props
		this.props.showSendContractPage({methodSelected, methodABI, inputValues})
	}
}

function mapStateToProps (state) {
	const result = {
		selected: state.metamask.selectedAddress,
		accounts: state.metamask.accounts,
		keyrings: state.metamask.keyrings,
		identities: state.metamask.identities,
		warning: state.appState.warning,
		txParams: state.appState.txParams,
		methodSelected: state.appState.contractAcc && state.appState.contractAcc.methodSelected,
		methodABI: state.appState.contractAcc && state.appState.contractAcc.methodABI,
		inputValues: state.appState.contractAcc && state.appState.contractAcc.inputValues,
	}

	result.error = result.warning && result.warning.message
	return result
}

function mapDispatchToProps (dispatch) {
	return {
		showLoadingIndication: () => dispatch(actions.showLoadingIndication()),
		hideLoadingIndication: () => dispatch(actions.hideLoadingIndication()),
		hideWarning: () => dispatch(actions.hideWarning()),
		signTx: (txParams) => dispatch(actions.signTx(txParams)),
		setSelectedAddress: (address) => dispatch(actions.setSelectedAddress(address)),
		showSendContractPage: ({ methodSelected, methodABI, inputValues }) => dispatch(actions.showSendContractPage({methodSelected, methodABI, inputValues})),
	}
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ChooseContractExecutor)
