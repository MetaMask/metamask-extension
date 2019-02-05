import React, {Component} from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classnames from 'classnames'
import actions from '../../../ui/app/actions'

class ToastComponent extends Component {
	static propTypes = {
		msg: PropTypes.string,
		toastMsg: PropTypes.string,
		isSuccess: PropTypes.bool,
		hideToast: PropTypes.func,
	}

	constructor (props) {
		super(props)
		this.timerID = null
	}

	componentDidUpdate (prevProps) {
		if ((!prevProps.msg && this.props.msg) || (!prevProps.toastMsg && this.props.toastMsg)) {
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
		let toastMsg = this.props.msg || this.props.toastMsg
		toastMsg = (toastMsg && toastMsg.message) || toastMsg
		return toastMsg ? (
			<div
				className={classnames('toast', {
					'green': this.props.isSuccess,
					'red': !this.props.isSuccess,
				})}
				onClick={(e) => this.props.hideToast()}
			>{toastMsg}</div>
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
