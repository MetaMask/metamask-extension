import { connect } from 'react-redux';
import { updateSendHexData } from '../../../../ducks/send/send.duck';
import SendHexDataRow from './send-hex-data-row.component';

export default connect(mapStateToProps, mapDispatchToProps)(SendHexDataRow);

function mapStateToProps(state) {
  return {
    data: state.send.data,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendHexData(data) {
      return dispatch(updateSendHexData(data));
    },
  };
}
