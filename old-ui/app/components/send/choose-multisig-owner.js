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
		hideWarning: PropTypes.func,
		signTx: PropTypes.func,
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
				<SendHeader title="Choose multisig owner" />
				<SendError
					error={error}
					onClose={() => {
						this.props.hideWarning()
					}}
				/>
				<div style={{ padding: '0 30px' }}>
					<h4>Transaction to multisig will be sent from selected account</h4>
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
		txParams.from = this.state.selectedOwner

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
}

function mapStateToProps (state) {
	const result = {
		selected: state.metamask.selectedAddress,
		accounts: state.metamask.accounts,
		keyrings: state.metamask.keyrings,
		identities: state.metamask.identities,
		warning: state.appState.warning,
		txParams: state.appState.txParams,
	}

	result.error = result.warning && result.warning.message
	return result
}

function mapDispatchToProps (dispatch) {
	return {
		hideWarning: () => dispatch(actions.hideWarning()),
		signTx: (txParams) => dispatch(actions.signTx(txParams)),
	}
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ChooseMultisigOwner)
