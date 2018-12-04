import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import SendProfile from './send-profile'
import ExecutorCell from './executor-cell'
import SendHeader from './send-header'
import SendError from './send-error'
import actions from '../../../../ui/app/actions'

class ChooseContractExecutor extends Component {
	constructor (props) {
		super(props)
		this.state = {
			selectedExecutor: '',
			accountsCells: [],
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
					<span className="hw-connect__header__msg">contract transaction will be executed from selected account</span>
				</div>
				<div style={{
					padding: '0 30px',
					maxHeight: '350px',
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

	componentDidMount () {
		this.generateListOfAccounts()
	}

	componentDidUpdate (prevProps, prevState) {
		if (prevState.selectedExecutor !== this.state.selectedExecutor) {
			this.generateListOfAccounts()
		}
	}

	buttonsSection () {
		const nextButton = (
			<button className="choose-contract-next-button" onClick={() => this.onSubmit() }>Next</button>
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

	generateListOfAccounts () {
		const { keyrings, identities } = this.props
		const accountsCells = []
		keyrings.forEach((keyring) => {
			if (keyring.type !== 'Simple Address') {
				keyring.accounts.forEach((address) => {
					const identity = identities[address]
					accountsCells.push(
						<ExecutorCell
							key={Math.random()}
							address={address}
							identity={identity}
							isAccountSelected={this.isAccountSelected(address)}
							onClick={(e) => this.selectExecutor(e, address)}
						/>
					)
				})
			}
		})

		this.setState({
			accountsCells,
		})
	}

	onSubmit = () => {
		const { txParams } = this.props
		const { selectedExecutor } = this.state
		this.props.setSelectedAddress(selectedExecutor)
		txParams.from = selectedExecutor
		this.props.signTx(txParams)
	}

	selectExecutor (e, address) {
		this.setState({
			selectedExecutor: address,
		})
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
		hideWarning: () => dispatch(actions.hideWarning()),
		signTx: (txParams) => dispatch(actions.signTx(txParams)),
		setSelectedAddress: (address) => dispatch(actions.setSelectedAddress(address)),
		showSendContractPage: ({methodSelected, methodABI, inputValues}) => dispatch(actions.showSendContractPage({methodSelected, methodABI, inputValues})),
	}
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ChooseContractExecutor)
