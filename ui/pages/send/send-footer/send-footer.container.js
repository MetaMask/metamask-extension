import { connect } from 'react-redux';
import { addToAddressBook, cancelTx } from '../../../store/actions';
import {
  getRenderableEstimateDataForSmallButtonsFromGWEI,
  getDefaultActiveButtonIndex,
} from '../../../selectors';
import {
  resetSendState,
  getGasPrice,
  getSendStage,
  getSendTo,
  getSendErrors,
  isSendFormInvalid,
  signTransaction,
  getDraftTransactionID,
} from '../../../ducks/send';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { addHexPrefix } from '../../../../app/scripts/lib/util';
import { getSendToAccounts } from '../../../ducks/metamask/metamask';
import { CUSTOM_GAS_ESTIMATE } from '../../../../shared/constants/gas';
import SendFooter from './send-footer.component';

export default connect(mapStateToProps, mapDispatchToProps)(SendFooter);

function addressIsNew(toAccounts, newAddress) {
  const newAddressNormalized = newAddress.toLowerCase();
  const foundMatching = toAccounts.some(
    ({ address }) => address.toLowerCase() === newAddressNormalized,
  );
  return !foundMatching;
}

function mapStateToProps(state) {
  const gasButtonInfo = getRenderableEstimateDataForSmallButtonsFromGWEI(state);
  const gasPrice = getGasPrice(state);
  const activeButtonIndex = getDefaultActiveButtonIndex(
    gasButtonInfo,
    gasPrice,
  );
  const gasEstimateType =
    activeButtonIndex >= 0
      ? gasButtonInfo[activeButtonIndex].gasEstimateType
      : CUSTOM_GAS_ESTIMATE;

  return {
    disabled: isSendFormInvalid(state),
    to: getSendTo(state),
    toAccounts: getSendToAccounts(state),
    sendStage: getSendStage(state),
    sendErrors: getSendErrors(state),
    draftTransactionID: getDraftTransactionID(state),
    gasEstimateType,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    resetSendState: () => dispatch(resetSendState()),
    cancelTx: (t) => dispatch(cancelTx(t)),
    sign: () => dispatch(signTransaction()),
    addToAddressBookIfNew: (newAddress, toAccounts, nickname = '') => {
      const hexPrefixedAddress = addHexPrefix(newAddress);
      if (addressIsNew(toAccounts, hexPrefixedAddress)) {
        // TODO: nickname, i.e. addToAddressBook(recipient, nickname)
        dispatch(addToAddressBook(hexPrefixedAddress, nickname));
      }
    },
  };
}
