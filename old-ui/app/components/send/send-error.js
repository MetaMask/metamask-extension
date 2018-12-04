import React, {Component} from 'react'
import PropTypes from 'prop-types'

class SendError extends Component {
	static propTypes = {
		error: PropTypes.string,
		onClose: PropTypes.func,
	}

	render () {
		return this.props.error ? (
			<div style={{
				textAlign: 'center',
				position: 'absolute',
				top: '0',
				background: 'rgba(255, 255, 255, 0.85)',
				width: '100%',
				paddingLeft: '30px',
				paddingRight: '30px',
				paddingTop: '70%',
				zIndex: '100',
				height: '100%',
			}}>
				<div
					style={{
						backgroundImage: `url('../images/close.svg')`,
						backgroundRepeat: 'no-repeat',
						width: '16px',
						height: '16px',
						cursor: 'pointer',
					}}
					onClick={(e) => this.props.onClose(e)}
				/>
				<div style={{
					marginLeft: '30px',
					marginRight: '30px',
				}} >
					<div
						className="error"
						style={{
							wordBreak: 'break-word',
						}}
					>{this.props.error}</div>
				</div>
			</div>
		) : null
	}
}

module.exports = SendError
