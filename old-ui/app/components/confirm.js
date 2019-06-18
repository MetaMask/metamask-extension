import React, { Component } from 'react'
import PropTypes from 'prop-types'

class ConfirmScreen extends Component {
	static propTypes = {
		subtitle: PropTypes.string.isRequired,
		renderAdditionalData: PropTypes.func,
		question: PropTypes.string.isRequired,
		withDescription: PropTypes.bool,
		description: PropTypes.string,
		onCancelClick: PropTypes.func.isRequired,
		onNoClick: PropTypes.func.isRequired,
		onYesClick: PropTypes.func.isRequired,
	}

	render () {
		return (
		<div
			className="flex-column flex-grow"
			style={{
				overflowX: 'auto',
				overflowY: 'hidden',
			}}
		>
			<div className="section-title flex-row flex-center">
				<i className="fa fa-arrow-left fa-lg cursor-pointer"
					onClick={() => this.props.onCancelClick()}
					style={{
					position: 'absolute',
					left: '30px',
				}}
				/>
				<h2 className="page-subtitle">{this.props.subtitle}</h2>
			</div>
			{this.props.withDescription ? (
				<div style={{
					margin: '0px 30px 20px',
				}}>
					<div className="error">{this.props.description}</div>
				</div>
			) : null}
			{this.props.renderAdditionalData ? this.props.renderAdditionalData() : null}
			<p className="confirm-label"
				style={{
					textAlign: 'center',
					margin: '0px 30px 20px ',
				}}
			>{this.props.question}
			</p>
			<div className="flex-row flex-right"
				style={{
					marginRight: '30px',
				}}
			>
				<button className="btn-violet"
					onClick={() => this.props.onNoClick()}>
					No
				</button>
				<button
					onClick={() => this.props.onYesClick()}
				>
					Yes
				</button>
			</div>
		</div>
		)
	}
}

module.exports = ConfirmScreen
