import { connect } from 'react-redux';

import { addTokens, clearPendingTokens } from '../../store/actions';
import ConfirmImportToken from './confirm-import-token';

const mapDispatchToProps = (dispatch) => {
  return {
    addTokens: (tokens) => dispatch(addTokens(tokens)),
    clearPendingTokens: () => dispatch(clearPendingTokens()),
  };
};

export default connect(null, mapDispatchToProps)(ConfirmImportToken);
