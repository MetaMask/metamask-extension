import ConfirmScreen from '../confirm'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import actions from '../../../../ui/app/actions'
import { capitalizeFirstLetter } from '../../../../app/scripts/lib/util'

class ForgetDeviceScreen extends Component {
	constructor (props) {
		super(props)
		this.state = {
			clearAccounts: false,
		}
	}

	static propTypes = {
		device: PropTypes.string,
		showConnectHWWalletPage: PropTypes.func,
		forgetDevice: PropTypes.func,
		goHome: PropTypes.func,
	}

	render () {
		return (
			<ConfirmScreen
				subtitle="Forget device"
				question={`Are you sure you want to forget this ${capitalizeFirstLetter(this.props.device)} ?`}
				onCancelClick={() => this.props.showConnectHWWalletPage()}
				renderAdditionalData={() => {
					return (
						<div style={{
							margin: '0px 30px 20px',
						}}>
							<input
								type="checkbox"
								value={this.state.clearAccounts}
								onChange={(e) => {
									const clearAccountsPrev = this.state.clearAccounts
									const clearAccountsNew = !clearAccountsPrev
									this.setState({clearAccounts: clearAccountsNew})
								}}
							/>
							<span style={{'paddingLeft': '5px'}}>Remove associated accounts from the list of imported accounts in the wallet</span>
						</div>
					)
				}}
				onNoClick={() => this.props.showConnectHWWalletPage()}
				onYesClick={() => {
					this.props.forgetDevice(this.props.device, this.state.clearAccounts)
					.then(_ => {
						this.setState({
							error: null,
							selectedAccount: null,
							selectedAccounts: [],
							accounts: [],
							unlocked: false,
						})
					})
					.catch(e => {
						this.setState({ error: (e.message || e.toString()) })
					})
					.finally(() => {
						this.props.goHome()
					})
				}}
			/>
		)
	}
}

const mapStateToProps = (state) => {
	return {
		device: state.appState.currentView.device,
	}
}

const mapDispatchToProps = dispatch => {
  return {
    showConnectHWWalletPage: () => dispatch(actions.showConnectHWWalletPage()),
    forgetDevice: (device, clearAccounts) => dispatch(actions.forgetDevice(device, clearAccounts)),
    goHome: () => dispatch(actions.goHome()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ForgetDeviceScreen)
