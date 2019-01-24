import ConfirmScreen from '../confirm'
import React from 'react'
import { connect } from 'react-redux'
import actions from '../../../../ui/app/actions'

class ForgetDevice extends ConfirmScreen {
	render () {
		return (
			<ConfirmScreen
				subtitle="Forget device"
				question={`Are you sure to forget this device ?`}
				onCancelClick={() => this.props.dispatch(actions.showConnectHWWalletPage())}
				additionalData={() => {
					// todo: checkbox
					return (
						<span>Remove imported associated accounts</span>
						)
				}}
				onNoClick={() => this.props.dispatch(actions.showConnectHWWalletPage())}
				onYesClick={() => {
					this.props.forgetDevice(this.props.device)
					.then(_ => {
						this.setState({
							error: null,
							selectedAccount: null,
							selectedAccounts: [],
							accounts: [],
							unlocked: false,
						})
					}).catch(e => {
						this.setState({ error: (e.message || e.toString()) })
					})
				}}
			/>
		)
	}
}

module.exports = connect()(ForgetDevice)
