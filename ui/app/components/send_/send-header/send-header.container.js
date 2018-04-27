import { connect } from 'react-redux'
import { goHome, clearSend } from '../../../actions'
import SendHeader from './send-header.component'
import { getSelectedToken } from '../../../selectors'

export default connect(mapStateToProps, mapDispatchToProps)(SendHeader)

function mapStateToProps (state) {
  return {
    isToken: Boolean(getSelectedToken(state)),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    clearSend: () => dispatch(clearSend()),
    goHome: () => dispatch(goHome()),
  }
}
