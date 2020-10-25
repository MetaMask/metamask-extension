import { connect } from 'react-redux'
import { updateSendHexData } from '../../../../store/actions'
import SendHexDataRow from './send-hex-data-row.component'
import { getSendErrors } from '../../send.selectors'

export default connect(mapStateToProps, mapDispatchToProps)(SendHexDataRow)

function mapStateToProps (state) {
  const sendErrors = getSendErrors(state)
  return {
    data: state.metamask.send.data,
    hasHexDataError: Boolean(sendErrors && sendErrors.hexData),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    updateSendHexData (data) {
      return dispatch(updateSendHexData(data))
    },
  }
}
