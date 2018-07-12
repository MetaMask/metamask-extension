const Component = require('react').Component
const PropTypes = require('prop-types')
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const { withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const actions = require('../actions')
const selectors = require('../selectors')
const { SEND_ROUTE } = require('../routes')
const { checksumAddress: toChecksumAddress } = require('../util')

const BalanceComponent = require('./balance-component')
const Tooltip = require('./tooltip')
const TxList = require('./tx-list')
const SelectedAccount = require('./selected-account')

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(TxView)

TxView.contextTypes = {
  t: PropTypes.func,
}

function mapStateToProps (state) {
  const sidebarOpen = state.appState.sidebarOpen
  const isMascara = state.appState.isMascara

  const identities = state.metamask.identities
  const accounts = state.metamask.accounts
  const network = state.metamask.network
  const selectedTokenAddress = state.metamask.selectedTokenAddress
  const selectedAddress = state.metamask.selectedAddress || Object.keys(accounts)[0]
  const checksumAddress = toChecksumAddress(selectedAddress)
  const identity = identities[selectedAddress]

  return {
    sidebarOpen,
    selectedAddress,
    checksumAddress,
    selectedTokenAddress,
    selectedToken: selectors.getSelectedToken(state),
    identity,
    network,
    isMascara,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showSidebar: () => { dispatch(actions.showSidebar()) },
    hideSidebar: () => { dispatch(actions.hideSidebar()) },
    showModal: (payload) => { dispatch(actions.showModal(payload)) },
    showSendPage: () => { dispatch(actions.showSendPage()) },
    showSendTokenPage: () => { dispatch(actions.showSendTokenPage()) },
  }
}

inherits(TxView, Component)
function TxView () {
  Component.call(this)
}

TxView.prototype.renderHeroBalance = function () {
  const { selectedToken } = this.props

  return h('div.hero-balance', {}, [

    h(BalanceComponent, { token: selectedToken }),

    this.renderButtons(),
  ])
}

TxView.prototype.renderButtons = function () {
  const {selectedToken, showModal, history } = this.props

  return !selectedToken
    ? (
      h('div.flex-row.flex-center.hero-balance-buttons', [
        h('button.btn-primary.hero-balance-button', {
          onClick: () => showModal({
            name: 'DEPOSIT_ETHER',
          }),
        }, this.context.t('deposit')),

        h('button.btn-primary.hero-balance-button', {
          style: {
            marginLeft: '0.8em',
          },
          onClick: () => history.push(SEND_ROUTE),
        }, this.context.t('send')),
      ])
    )
    : (
      h('div.flex-row.flex-center.hero-balance-buttons', [
        h('button.btn-primary.hero-balance-button', {
          onClick: () => history.push(SEND_ROUTE),
        }, this.context.t('send')),
      ])
    )
}

TxView.prototype.render = function () {
  const { hideSidebar, isMascara, showSidebar, sidebarOpen } = this.props
  const { t } = this.context

  return h('div.tx-view.flex-column', {
    style: {},
  }, [

    h('div.flex-row.phone-visible', {
      style: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: '0 0 auto',
        marginBottom: '16px',
        padding: '5px',
        borderBottom: '1px solid #e5e5e5',
      },
    }, [

      h(Tooltip, {
        title: t('menu'),
        position: 'bottom',
      }, [
        h('div.fa.fa-bars', {
          style: {
            fontSize: '1.3em',
            cursor: 'pointer',
            padding: '10px',
          },
          onClick: () => sidebarOpen ? hideSidebar() : showSidebar(),
        }),
      ]),

      h(SelectedAccount),

      !isMascara && h(Tooltip, {
        title: t('openInTab'),
        position: 'bottom',
      }, [
        h('div.open-in-browser', {
          onClick: () => global.platform.openExtensionInBrowser(),
        }, [h('img', { src: 'images/popout.svg' })]),
      ]),
    ]),

    this.renderHeroBalance(),

    h(TxList),

  ])
}
