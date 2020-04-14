import React, {Component} from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classnames from 'classnames'
import actions from '../../../ui/app/actions'

const TOAST_TYPE_SUCCESS = 'success'
const TOAST_TYPE_ERROR = 'error'

const ERROR_ON_INCORRECT_DPATH = 'The account is derived from ETH derivation path despite you connected to another chain. If you are ready to switch to correct derivation path, just restore from the same seed phrase.'

class ToastComponent extends Component {
	static propTypes = {
		msg: PropTypes.string,
		toastMsg: PropTypes.string,
		type: PropTypes.string,
		hideToast: PropTypes.func,
		hideManually: PropTypes.bool,
	}

	constructor (props) {
		super(props)
		this.timerID = null
	}

	componentDidUpdate (prevProps) {
		if ((!prevProps.msg && this.props.msg) || (!prevProps.toastMsg && this.props.toastMsg)) {
			if (!this.props.hideManually) {
				this.timerID = setTimeout(() => {
					this.props.hideToast()
					clearTimeout(this.timerID)
				}, 4000)
			}
		}
	}

	componentWillUnmount () {
		this.props.hideToast()
		clearTimeout(this.timerID)
	}

	_getClass (type) {
		switch (type) {
			case TOAST_TYPE_SUCCESS:
			return 'green'
			case TOAST_TYPE_ERROR:
			return 'red'
			default:
				return 'green'
		}
	}

	render () {
		let toastMsg = this.props.msg || this.props.toastMsg
		toastMsg = (toastMsg && toastMsg.message) || toastMsg
		return toastMsg ? (
			<div
				className={classnames('toast', this._getClass(this.props.type))}
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

module.exports = {
	ToastComponent: connect(mapStateToProps, mapDispatchToProps)(ToastComponent),
	TOAST_TYPE_SUCCESS,
	TOAST_TYPE_ERROR,
	ERROR_ON_INCORRECT_DPATH,
}
