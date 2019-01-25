import ConfirmScreen from '../confirm'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import actions from '../../../../ui/app/actions'
import { capitalizeFirstLetter } from '../../../../app/scripts/lib/util'

class ForgetDeviceScreen extends Component {
	constructor (props) {
		super(props)
		this.state = {
			clearAccounts: false
		}
	}

	render () {
		return (
			<ConfirmScreen
				subtitle="Forget device"
				question={`Are you sure you want to forget this ${capitalizeFirstLetter(this.props.device)} ?`}
				onCancelClick={() => this.props.dispatch(actions.showConnectHWWalletPage())}
				renderAdditionalData={() => {
					return (
						<div style={{
							margin: '0px 30px 20px'
						}}>
							<input
								type='checkbox'
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
				onNoClick={() => this.props.dispatch(actions.showConnectHWWalletPage())}
				onYesClick={() => {
					this.props.dispatch(actions.forgetDevice(this.props.device, this.state.clearAccounts))
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
						this.props.dispatch(actions.goHome())
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

module.exports = connect(mapStateToProps)(ForgetDeviceScreen)
