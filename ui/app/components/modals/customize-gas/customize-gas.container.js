import { connect } from 'react-redux'
import CustomizeGas from './customize-gas.component'
import { hideModal } from '../../../actions'

const mapStateToProps = state => {
  const { appState: { modal: { modalState: { props } } } } = state
  const { txData, onSubmit, validate } = props

  return {
    txData,
    onSubmit,
    validate,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    hideModal: () => dispatch(hideModal()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CustomizeGas)
