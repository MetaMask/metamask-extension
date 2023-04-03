import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getInstitutionalConnectRequests } from '../../ducks/institutional/institutional';
import {
  getMMIActions,
  showInteractiveReplacementTokenBanner,
} from '../../store/actions';
import { getMetaMaskAccounts } from '../../selectors';
import InteractiveReplacementTokenPage from './interactive-replacement-token-page.component';

const mapStateToProps = (state) => {
  const address =
    state.appState.modal.modalState.props.address ||
    state.metamask.selectedAddress;
  const custodyAccountDetails =
    state.metamask.custodyAccountDetails[toChecksumHexAddress(address)];
  const custodianName = custodyAccountDetails?.custodianName;
  const { url } = state.metamask.interactiveReplacementToken || {};
  const { custodians } = state.metamask.mmiConfiguration;
  const custodian =
    custodians.find((item) => item.name === custodianName) || {};

  return {
    custodian,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    connectRequests: getInstitutionalConnectRequests(state),
    metaMaskAccounts: getMetaMaskAccounts(state),
    url,
  };
};

const mapDispatchToProps = (dispatch) => {
  const MMIActions = getMMIActions();

  return {
    removeAddTokenConnectRequest: ({ origin, apiUrl, token }) =>
      dispatch(
        MMIActions.removeAddTokenConnectRequest({ origin, apiUrl, token }),
      ),
    setCustodianNewRefreshToken: ({ address, newAuthDetails }) =>
      dispatch(
        MMIActions.setCustodianNewRefreshToken({
          address,
          newAuthDetails,
        }),
      ),
    showInteractiveReplacementTokenBanner: ({ url }) =>
      dispatch(showInteractiveReplacementTokenBanner({ url })),
    getCustodianAccounts: (token, apiUrl, custody, getNonImportedAccounts) => {
      return dispatch(
        MMIActions.getCustodianAccounts(
          token,
          apiUrl,
          custody,
          getNonImportedAccounts,
        ),
      );
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(InteractiveReplacementTokenPage);
