import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { rejectWatchAsset, acceptWatchAsset } from '../../store/actions';
import ConfirmAddSuggestedToken from './confirm-add-suggested-token';

const mapDispatchToProps = (dispatch) => {
  return {
    rejectWatchAsset: (suggestedAssetID) =>
      dispatch(rejectWatchAsset(suggestedAssetID)),
    acceptWatchAsset: (suggestedAssetID) =>
      dispatch(acceptWatchAsset(suggestedAssetID)),
  };
};

export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
)(ConfirmAddSuggestedToken);
