import { connect } from 'react-redux'
import { getSendWarnings } from '../../../send.selectors'
import SendRowWarningMessage from './send-row-warning-message.component'

export default connect(mapStateToProps)(SendRowWarningMessage)

function mapStateToProps (state, ownProps) {
  return {
    warnings: getSendWarnings(state),
    warningType: ownProps.warningType,
  }
}
