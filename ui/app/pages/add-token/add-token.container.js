import { connect } from 'react-redux'
import AddToken from './add-token.component'

import { setPendingTokens, clearPendingTokens } from '../../store/actions'

const mapStateToProps = ({ metamask }) => {
  const {
    identities,
    tokens,
    pendingTokens,
    trustedTokenMap,
    network,
  } = metamask
  return {
    identities,
    network: parseInt(network, 10),
    tokens,
    pendingTokens,
    trustedTokenMap,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setPendingTokens: tokens => dispatch(setPendingTokens(tokens)),
    clearPendingTokens: () => dispatch(clearPendingTokens()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddToken)
