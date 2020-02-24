import { connect } from 'react-redux'
import ConfirmAddToken from './confirm-add-token.component'

import { addTokens, clearPendingTokens } from '../../store/actions'

const mapStateToProps = ({ metamask }) => {
  const { pendingTokens } = metamask
  return {
    pendingTokens,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    addTokens: (tokens) => dispatch(addTokens(tokens)),
    clearPendingTokens: () => dispatch(clearPendingTokens()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmAddToken)
