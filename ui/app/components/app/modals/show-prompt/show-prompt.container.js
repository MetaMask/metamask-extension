import { connect } from 'react-redux'
import { compose } from 'recompose'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import ShowPrompt from './show-prompt.component'
import { resolvePrompt, rejectPrompt } from '../../../../store/actions'

const mapStateToProps = (state) => {
  return {
    prompt: state.appState.modal.modalState.props.prompt,
  }
}

const mapDispatchToProps = () => {
  return {
    resolvePrompt: (id, value) => resolvePrompt(id, value),
    rejectPrompt: (id) => rejectPrompt(id),
  }
}

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps)
)(ShowPrompt)
