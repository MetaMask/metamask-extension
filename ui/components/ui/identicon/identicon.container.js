import { connect } from 'react-redux';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../../shared/constants/tokens';
import { getIsTokenDetectionInactiveOnMainnet } from '../../../selectors';
import Identicon from './identicon.component';

const mapStateToProps = (state) => {
  const {
    metamask: { useBlockie, tokenList, ipfsGateway },
  } = state;

  const isTokenDetectionInactiveOnMainnet = getIsTokenDetectionInactiveOnMainnet(
    state,
  );
  const caseInSensitiveTokenList = isTokenDetectionInactiveOnMainnet
    ? STATIC_MAINNET_TOKEN_LIST
    : tokenList;

  return {
    useBlockie,
    caseInSensitiveTokenList,
    ipfsGateway,
    isTokenDetectionInactiveOnMainnet,
  };
};

export default connect(mapStateToProps)(Identicon);
