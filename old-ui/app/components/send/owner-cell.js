import React, {Component} from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Identicon from '../identicon'
import { addressSummary } from '../../util'

class OwnerCell extends Component {
	constructor (props) {
		super(props)
		this.state = {
			isSelected: props.isAccountSelected,
		}
	}

	static propTypes = {
		isAccountSelected: PropTypes.bool,
		address: PropTypes.string,
		identity: PropTypes.object,
		onClick: PropTypes.func,
	}

	render () {
		const {
			address,
			identity,
		} = this.props

		return (
			<div
				className={this.state.isSelected ? 'owner-cell-container-selected' : 'owner-cell-container'}
				onClick={(e) => {
					this.setState({
						isSelected: !this.state.isSelected,
					})
					this.props.onClick(e)
				}}
			>
				<div
					className="account-data-subsection flex-row flex-grow"
					style={{
						background: 'linear-gradient(rgb(84, 36, 147), rgb(104, 45, 182))',
						padding: '20px',
						borderRadius: '5px',
					}}
				>
					{/* header - identicon + nav */}
					<div className="flex-row flex-space-between">
						{/* large identicon*/}
						<div
						className="identicon-wrapper flex-column flex-center select-none"
						style={{ display: 'inline-block' }}
						>
							<Identicon diameter={40} address={address} />
						</div>
						{/* invisible place holder */}
						<i className="fa fa-users fa-lg invisible" style={{ marginTop: '28px' }} />
					</div>
					{/* account label */}
					<div className="flex-column" style={{ alignItems: 'flex-start' }} >
						<h2
						className="font-medium flex-center"
						style={{
							color: '#ffffff',
							marginBottom: '8px',
						}}
						>{identity && identity.name}</h2>
						{/* address and getter actions */}
						<div
						className="flex-row flex-center"
						style={{
							color: 'rgba(255, 255, 255, 0.7)',
						}}
						>
							<div style={{ lineHeight: '16px', fontSize: '14px' }}>
								{addressSummary(address)}
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
}

function mapStateToProps (state) {
	var result = {
		accounts: state.metamask.accounts,
	}

	return result
}

module.exports = connect(mapStateToProps)(OwnerCell)
