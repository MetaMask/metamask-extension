import React, {Component} from 'react'
import { connect } from 'react-redux'
import Identicon from '../identicon'
import { addressSummary } from '../../util'
import EthBalance from '../eth-balance'
import TokenBalance from '../token-balance'

class SendProfile extends Component {
	render () {
		const props = this.props
		const {
			address,
			account,
			identity,
			network,
			conversionRate,
			currentCurrency,
			isToken,
			token,
		} = props
		return (
			<div
				className="account-data-subsection flex-row flex-grow"
				style={{
					background: 'linear-gradient(rgb(84, 36, 147), rgb(104, 45, 182))',
					padding: '30px',
					minHeight: '178px',
				}}
			>
				{/* header - identicon + nav */}
				<div className="flex-row flex-space-between">
					{/* large identicon*/}
					<div
					className="identicon-wrapper flex-column flex-center select-none"
					style={{ display: 'inline-block' }}
					>
						<Identicon diameter={62} address={address} />
					</div>
					{/* invisible place holder */}
					<i className="fa fa-users fa-lg invisible" style={{ marginTop: '28px' }} />
				</div>
				{/* account label */}
				<div className="flex-column" style={{ alignItems: 'flex-start' }} >
					<h2
						className="send-profile-identity-name font-medium flex-center"
						style={{
							color: '#ffffff',
							paddingTop: '8px',
							marginBottom: '8px',
						}}
					>{identity && identity.name}</h2>
					{/* address and getter actions */}
					<div
						className="flex-row flex-center"
						style={{
							color: 'rgba(255, 255, 255, 0.7)',
							marginBottom: '30px',
						}}
					>
						<div className="send-profile-address" style={{ lineHeight: '16px', fontSize: '14px' }}>
							{addressSummary(address)}
						</div>
					</div>
					{/* balance */}
					<div className="flex-row flex-center">
						{isToken ? <TokenBalance token={token} /> : <EthBalance {...{
							value: account && account.balance,
							conversionRate,
							currentCurrency,
							network,
						}} />}
					</div>
				</div>
			</div>
		)
	}
}

function mapStateToProps (state) {
	var result = {
		address: state.metamask.selectedAddress,
		accounts: state.metamask.accounts,
		identities: state.metamask.identities,
		network: state.metamask.network,
		conversionRate: state.metamask.conversionRate,
		currentCurrency: state.metamask.currentCurrency,
	}

	result.account = result.accounts[result.address]
	result.identity = result.identities[result.address]

	return result
}

module.exports = connect(mapStateToProps)(SendProfile)
