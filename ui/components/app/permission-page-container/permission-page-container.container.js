import { connect } from 'react-redux';
import { domainOutsideWhitelist } from '../../../helpers/utils/util';
import { getMetaMaskIdentities } from '../../../selectors';
import PermissionPageContainer from './permission-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const { selectedIdentities } = ownProps;

  const allIdentities = getMetaMaskIdentities(state);
  const requestMetadata = ownProps.request?.metadata
    ? new URL(ownProps.request?.metadata?.origin)
    : null;
  const { useWhitelistMode, whitelistValues } = state.metamask;
  const isNonWhitelistedDomain = domainOutsideWhitelist(
    requestMetadata?.host,
    useWhitelistMode,
    whitelistValues,
  );
  const allIdentitiesSelected =
    Object.keys(selectedIdentities).length ===
      Object.keys(allIdentities).length && selectedIdentities.length > 1;

  return {
    isNonWhitelistedDomain,
    allIdentitiesSelected,
  };
};

export default connect(mapStateToProps)(PermissionPageContainer);
