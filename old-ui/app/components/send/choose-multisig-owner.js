import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import SendProfile from './send-profile'
import OwnerCell from './owner-cell'
import SendHeader from './send-header'
import SendError from './send-multisig-error'
import actions from '../../../../ui/app/actions'

class ChooseMultisigOwner extends Component {
	constructor (props) {
		super(props)
		this.state = {
			selectedOwner: '',
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
		showSendMultisigPage: PropTypes.func,
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
				<SendHeader title="Choose multisig owner" back={() => this.back()} />
				<SendError
					error={error}
					onClose={() => {
						this.props.hideWarning()
					}}
				/>
				<div style={{ padding: '0 30px' }}>
					<span className="hw-connect__header__msg">Transaction to multisig will be sent from selected account</span>
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
		if (prevState.selectedOwner !== this.state.selectedOwner) {
			this.generateListOfAccounts()
		}
	}

	buttonsSection () {
		const nextButton = (
			<button onClick={() => this.onSubmit() }>Next</button>
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
						<OwnerCell
							key={Math.random()}
							address={address}
							identity={identity}
							isAccountSelected={this.isAccountSelected(address)}
							onClick={(e) => this.selectOwner(e, address)}
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
		const { selectedOwner } = this.state
		this.props.setSelectedAddress(selectedOwner)
		txParams.from = selectedOwner
		this.props.signTx(txParams)
	}

	selectOwner (e, address) {
		this.setState({
			selectedOwner: address,
		})
	}

	isAccountSelected (address) {
		return address === this.state.selectedOwner
	}

	back () {
		const { methodSelected, methodABI, inputValues } = this.props
		this.props.showSendMultisigPage({methodSelected, methodABI, inputValues})
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
		methodSelected: state.appState.multisig && state.appState.multisig.methodSelected,
		methodABI: state.appState.multisig && state.appState.multisig.methodABI,
		inputValues: state.appState.multisig && state.appState.multisig.inputValues,
	}

	result.error = result.warning && result.warning.message
	return result
}

function mapDispatchToProps (dispatch) {
	return {
		hideWarning: () => dispatch(actions.hideWarning()),
		signTx: (txParams) => dispatch(actions.signTx(txParams)),
		setSelectedAddress: (address) => dispatch(actions.setSelectedAddress(address)),
		showSendMultisigPage: ({methodSelected, methodABI, inputValues}) => dispatch(actions.showSendMultisigPage({methodSelected, methodABI, inputValues})),
	}
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ChooseMultisigOwner)
