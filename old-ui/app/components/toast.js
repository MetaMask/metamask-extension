import React, {Component} from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classnames from 'classnames'
import actions from '../../../ui/app/actions'

class ToastComponent extends Component {
	static propTypes = {
		msg: PropTypes.string,
		isSuccess: PropTypes.bool,
		hideToast: PropTypes.func,
	}

	constructor (props) {
		super(props)
		this.timerID = null
	}

	componentDidUpdate (prevProps) {
		if (!prevProps.msg && this.props.msg) {
			this.timerID = setTimeout(() => {
				this.props.hideToast()
				clearTimeout(this.timerID)
			}, 4000)
		}
	}

	componentWillUnmount () {
		this.props.hideToast()
		clearTimeout(this.timerID)
	}

	render () {
		const { msg } = this.props
		return msg ? (
			<div
				className={classnames('toast', {
					'green': this.props.isSuccess,
					'red': !this.props.isSuccess,
				})}
				onClick={(e) => this.props.hideToast()}
			>{(msg && msg.message) || msg}</div>
		) : null
	}
}

function mapStateToProps (state) {
	return {
		toastMsg: state.appState.toastMsg,
	}
}

function mapDispatchToProps (dispatch) {
	return {
		hideToast: () => dispatch(actions.hideToast()),
	}
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ToastComponent)
