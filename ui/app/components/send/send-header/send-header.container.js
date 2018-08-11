import { connect } from 'react-redux'
import { clearSend } from '../../../actions'
import SendHeader from './send-header.component'
import { getSubtitleParams, getTitleKey } from './send-header.selectors'

export default connect(mapStateToProps, mapDispatchToProps)(SendHeader)

function mapStateToProps (state) {
  return {
    titleKey: getTitleKey(state),
    subtitleParams: getSubtitleParams(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    clearSend: () => dispatch(clearSend()),
  }
}
