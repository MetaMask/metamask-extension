import { connect } from 'react-redux';
import { getSendHexData, updateSendHexData } from '../../../../../ducks/send';
import SendHexDataRow from './send-hex-data-row.component';

export default connect(mapStateToProps, mapDispatchToProps)(SendHexDataRow);

function mapStateToProps(state) {
  return {
    data: getSendHexData(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendHexData(data) {
      return dispatch(updateSendHexData(data));
    },
  };
}
