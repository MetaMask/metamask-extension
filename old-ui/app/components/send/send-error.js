import React, {Component} from 'react'
import PropTypes from 'prop-types'

class SendError extends Component {
	static propTypes = {
		error: PropTypes.string,
	}

	render () {
		return this.props.error ? (
			<div style={{
				marginLeft: '30px',
				marginRight: '30px',
			}} >
				<div className="error flex-center">{this.props.error}</div>
			</div>
		) : null
	}
}

module.exports = SendError
