import { connect } from 'react-redux'
import AddTokenScreen from './add-token.component'

const { setPendingTokens, clearPendingTokens, displayWarning, goHome, addToken, showConfirmAddTokensPage } = require('../../../../ui/app/actions')

const mapStateToProps = ({ metamask }) => {
  const { identities, keyrings, tokens, pendingTokens, network } = metamask
  return {
    identities,
    keyrings,
    tokens,
    network,
    pendingTokens,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setPendingTokens: tokens => dispatch(setPendingTokens(tokens)),
    showConfirmAddTokensPage: () => dispatch(showConfirmAddTokensPage()),
    clearPendingTokens: () => dispatch(clearPendingTokens()),
    displayWarning: (warn) => dispatch(displayWarning(warn)),
    goHome: () => dispatch(goHome()),
    addToken: (address, symbol, decimals, token) => dispatch(addToken(address, symbol, decimals, token)),
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(AddTokenScreen)
