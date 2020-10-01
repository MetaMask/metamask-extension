import { connect } from 'react-redux'
import { updateAndSetCustomRpc } from '../../../store/actions'
import { getOnboardingInitiator } from '../../../selectors'
import EndOfFlow from './end-of-flow.component'

const firstTimeFlowTypeNameMap = {
  create: 'New Wallet Created',
  'import': 'New Wallet Imported',
}

const mapStateToProps = (state) => {
  const { metamask: { firstTimeFlowType } } = state

  return {
    completionMetaMetricsName: firstTimeFlowTypeNameMap[firstTimeFlowType],
    onboardingInitiator: getOnboardingInitiator(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setSpecialRPC: () => {
      if (!process.env.IN_TEST) {
        dispatch(updateAndSetCustomRpc('https://ganache-testnet.airswap-dev.codefi.network', '1', 'ETH', 'mainnet', {}))
      }
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EndOfFlow)
