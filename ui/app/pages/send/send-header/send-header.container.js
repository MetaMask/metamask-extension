import { connect } from 'react-redux'
import { clearSend } from '../../../store/actions'
import SendHeader from './send-header.component'
import { getTitleKey } from './send-header.selectors'

export default connect(mapStateToProps, mapDispatchToProps)(SendHeader)

function mapStateToProps (state) {
  return {
    titleKey: getTitleKey(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    clearSend: () => dispatch(clearSend()),
  }
}
