import { connect } from 'react-redux'
import actions from '../../../store/actions'
import SideBar from './sidebar.component'
const { WALLET_VIEW_SIDEBAR } = require('../../../components/app/sidebars/sidebar.constants')
import {
  submittedPendingTransactionsSelector,
} from '../../../selectors/transactions'

const mapStateToProps = state => {
  console.log(state)
  const {
    isOpen: sidebarIsOpen,
    transitionName: sidebarTransitionName,
    type: sidebarType,
    props,
  } = state.appState.sidebar
  const { transaction: sidebarTransaction } = props || {}
  const submittedPendingTransactions = submittedPendingTransactionsSelector(state)
  console.log(submittedPendingTransactions)

  const sidebarOnOverlayClose = sidebarType === WALLET_VIEW_SIDEBAR
    ? () => {
      console.log('Closed Sidebare Via Overlay')
      this.context.metricsEvent({
        eventOpts: {
          category: 'Navigation',
          action: 'Wallet Sidebar',
          name: 'Closed Sidebare Via Overlay',
        },
      })
    }
    : null

  const sidebarShouldClose = sidebarTransaction &&
      !sidebarTransaction.status === 'failed' &&
      !submittedPendingTransactions.find(({ id }) => id === sidebarTransaction.id)

  return {
    sidebarOpen: sidebarIsOpen,
    sidebarShouldClose,
    sidebarProps: props,
    transitionName: sidebarTransitionName,
    type: sidebarType,
    onOverlayClose: sidebarOnOverlayClose,
  }
}

const mapDispatchToProps = dispatch => ({
  hideSidebar: () => dispatch(actions.hideSidebar()),
})

export default connect(mapStateToProps, mapDispatchToProps)(SideBar)
