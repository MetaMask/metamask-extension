import { connect } from 'react-redux'
import { getSendErrors } from '../../../../../selectors'
import SendRowErrorMessage from './send-row-error-message.component'

export default connect(mapStateToProps)(SendRowErrorMessage)

function mapStateToProps(state, ownProps) {
  return {
    errors: getSendErrors(state),
    errorType: ownProps.errorType,
  }
}
