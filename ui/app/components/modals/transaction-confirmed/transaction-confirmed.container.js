import { connect } from 'react-redux'
import TransactionConfirmed from './transaction-confirmed.component'

const { hideModal } = require('../../../actions')

const mapStateToProps = state => {
  const { appState: { modal: { modalState: { props } } } } = state
  const { onHide } = props
  return {
    onHide,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    hideModal: () => dispatch(hideModal()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(TransactionConfirmed)
