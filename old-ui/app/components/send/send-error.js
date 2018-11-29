import React, {Component} from 'react'
import PropTypes from 'prop-types'

class SendError extends Component {
	static propTypes = {
		error: PropTypes.string,
	}

	render () {
		return this.props.error ? (
            <div style={{
                textAlign: 'center',
                position: 'absolute',
                top: '25px',
                background: 'rgba(255, 255, 255, 0.85)',
                width: '100%',
                paddingLeft: '30px',
                paddingRight: '30px',
            }}>
				<div style={{
					marginLeft: '30px',
					marginRight: '30px',
				}} >
					<div className="error flex-center">{this.props.error}</div>
				</div>
			</div>
		) : null
	}
}

module.exports = SendError
