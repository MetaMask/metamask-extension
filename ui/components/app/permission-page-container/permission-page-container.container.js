import { connect } from 'react-redux';
import { domainOutsideAllowlist } from '../../../helpers/utils/util';
import { getMetaMaskIdentities } from '../../../selectors';
import PermissionPageContainer from './permission-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const { selectedIdentities } = ownProps;

  const allIdentities = getMetaMaskIdentities(state);
  const requestMetadata = ownProps.request?.metadata
    ? new URL(ownProps.request?.metadata?.origin)
    : null;
  const { useAllowlistMode, allowlistValues } = state.metamask;
  const isNotAllowedDomain = domainOutsideAllowlist(
    requestMetadata?.host,
    useAllowlistMode,
    allowlistValues,
  );
  const allIdentitiesSelected =
    Object.keys(selectedIdentities).length ===
      Object.keys(allIdentities).length && selectedIdentities.length > 1;

  return {
    isNotAllowedDomain,
    allIdentitiesSelected,
  };
};

export default connect(mapStateToProps)(PermissionPageContainer);
