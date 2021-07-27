import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import { showSendTokenPage } from '../../store/actions';
import { ASSET_TYPES, editTransaction } from '../../ducks/send';
import { sendTokenTokenAmountAndToAddressSelector } from '../../selectors';
import ConfirmSendToken from './confirm-send-token.component';

const mapStateToProps = (state) => {
  const { tokenAmount } = sendTokenTokenAmountAndToAddressSelector(state);

  return {
    tokenAmount,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    editTransaction: ({ txData, tokenData, tokenProps: assetDetails }) => {
      const { id } = txData;
      dispatch(
        editTransaction(
          ASSET_TYPES.TOKEN,
          id.toString(),
          tokenData,
          assetDetails,
        ),
      );
      dispatch(clearConfirmTransaction());
      dispatch(showSendTokenPage());
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmSendToken);
