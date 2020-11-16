import { connect } from 'react-redux'
import { updateSendHexData } from '../../../../store/actions'
import SendHexDataRow from './send-hex-data-row.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendHexDataRow)

function mapStateToProps(state) {
  return {
    data: state.metamask.send.data,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendHexData(data) {
      return dispatch(updateSendHexData(data))
    },
  }
}
