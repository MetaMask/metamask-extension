import Home from './home.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { unconfirmedTransactionsCountSelector } from '../../selectors/confirm-transaction'
import { getCurrentEthBalance } from '../../selectors/selectors'
import {
  forceApproveProviderRequestByOrigin,
  unsetMigratedPrivacyMode,
} from '../../store/actions'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../app/scripts/lib/enums'

const activeTabDappProtocols = ['http:', 'https:', 'dweb:', 'ipfs:', 'ipns:', 'ssb:']

const mapStateToProps = state => {
  const { activeTab, metamask, appState } = state
  const {
    approvedOrigins,
    lostAccounts,
    suggestedTokens,
    providerRequests,
    migratedPrivacyMode,
    featureFlags: {
      privacyMode,
    } = {},
    seedPhraseBackedUp,
    tokens,
  } = metamask
  const accountBalance = getCurrentEthBalance(state)
  const { forgottenPassword } = appState

  const isUnconnected = Boolean(
    activeTab &&
    activeTabDappProtocols.includes(activeTab.protocol) &&
    privacyMode &&
    !approvedOrigins[activeTab.origin]
  )
  const isPopup = getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP

  return {
    lostAccounts,
    forgottenPassword,
    suggestedTokens,
    unconfirmedTransactionsCount: unconfirmedTransactionsCountSelector(state),
    providerRequests,
    showPrivacyModeNotification: migratedPrivacyMode,
    activeTab,
    viewingUnconnectedDapp: isUnconnected && isPopup,
    shouldShowSeedPhraseReminder: !seedPhraseBackedUp && (parseInt(accountBalance, 16) > 0 || tokens.length > 0),
  }
}

const mapDispatchToProps = (dispatch) => ({
  unsetMigratedPrivacyMode: () => dispatch(unsetMigratedPrivacyMode()),
  forceApproveProviderRequestByOrigin: (origin) => dispatch(forceApproveProviderRequestByOrigin(origin)),
})

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Home)
