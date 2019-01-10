import React, {Component} from 'react'
import { connect } from 'react-redux'
import actions from '../../../ui/app/actions'
import CoinbaseForm from './coinbase-form'
import ShapeshiftForm from './shapeshift-form'
import Loading from './loading'
import AccountPanel from './account-panel'
import RadioList from './custom-radio-list'
import { getNetworkDisplayName } from '../../../app/scripts/controllers/network/util'
import { getFaucets, getExchanges } from '../../../app/scripts/lib/buy-eth-url'
import { MAINNET_CODE } from '../../../app/scripts/controllers/network/enums'
import ethNetProps from 'eth-net-props'
import PropTypes from 'prop-types'

class BuyButtonSubview extends Component {
  render () {
    return (
      <div style={{ width: '100%' }}>
        { this.headerSubview() }
        { this.primarySubview() }
      </div>
    )
  }

  headerSubview () {
    const props = this.props
    const { network } = props
    const isLoading = props.isSubLoading
    const coinName = ethNetProps.props.getNetworkCoinName(network)
    return (
      <div className="flex-column">
        { /* loading indication*/ }
        <div>
          <Loading isLoading={isLoading} />
        </div>
        { /* account panel*/ }
        <div>
          <AccountPanel {...{
            showFullAddress: true,
            identity: props.identity,
            account: props.account,
            network: props.network,
          }} />
        </div>
        { /* header bar (back button, label)*/ }
        <div
          className="flex-row section-title"
          style={{
            alignItems: 'center',
          }}
        >
          <i
            className="fa fa-arrow-left fa-lg cursor-pointer"
            onClick={() => this.backButtonContext()}
            style={{
              position: 'absolute',
              left: '30px',
            }}
          />
          <h2 className="flex-center buy-title">{`Buy ${coinName}`}</h2>
        </div>
        <div>
          <h3 className="flex-center select-service">Select Service</h3>
        </div>
      </div>
    )
  }

  primarySubview () {
    const props = this.props
    const network = props.network

    switch (network) {
      case 'loading':
        return

      case '1':
        return this.mainnetSubview()

      default:
        return (
          <div className="flex-column" style={{ margin: '0px 0px 20px 30px' }}>
            { this._getBuyOptionsView(network) }
          </div>
        )
    }
  }

  _getBuyOptionsView (network) {
    const isTestnet = ethNetProps.props.isTestnet(network)
    if (isTestnet) {
      return this._getFaucetsView(network)
    } else {
      return this._getExchangesView(network)
    }
  }

  _getExchangesView (network) {
    const exchanges = getExchanges({network})
    return exchanges.map((exchange, ind) => {
      return <p
        key={`buy-option${ind}`}
        className="buy-option cursor-pointer"
        onClick={() => this.props.dispatch(actions.buyEth({ network, ind }))}
      >
        { exchange.name }
      </p>
    })
  }

  _getFaucetsView (network) {
    const faucets = getFaucets(network)
    if (faucets.length === 0) {
      return <h2 className="error">Unknown network ID</h2>
    }
    const networkName = getNetworkDisplayName(network)
    return faucets.map((faucet, ind) => {
      const faucetNum = faucets.length > 1 ? (ind + 1) : ''
      const faucetLabel = `${networkName} Test Faucet ${faucetNum}`
      return <p
        key={`buy-option${ind}`}
        className="buy-option cursor-pointer"
        onClick={() => this.props.dispatch(actions.buyEth({ network, ind }))}
      >
        { faucetLabel }
      </p>
    })
  }

  mainnetSubview () {
    const props = this.props

    return (
      <div className="flex-column">
        <div className="flex-row selected-exchange">
          <RadioList
            defaultFocus={props.buyView.subview}
            labels={[
              'Coinbase',
              'ShapeShift',
            ]}
            subtext={{
              'Coinbase': 'Crypto/FIAT (USA only)',
              'ShapeShift': 'Crypto',
            }}
            onClick={(event) => this.radioHandler(event)}
          />
        </div>
        <h3 className="select-service" style={{
          borderTop: '1px solid #e2e2e2',
          paddingTop: '20px',
        }}>
          { props.buyView.subview }
        </h3>
        { this.formVersionSubview() }
      </div>
    )
  }

  formVersionSubview () {
    const { network } = this.props
    if (Number(network) === MAINNET_CODE) {
      if (this.props.buyView.formView.coinbase) {
        return <CoinbaseForm { ...this.props } />
      } else if (this.props.buyView.formView.shapeshift) {
        return <ShapeshiftForm { ...this.props } />
      }
    }
  }

  backButtonContext () {
    if (this.props.context === 'confTx') {
      this.props.dispatch(actions.showConfTxPage({
        isContractExecutionByUser: this.props.isContractExecutionByUser,
      }))
    } else {
      this.props.dispatch(actions.goHome())
    }
  }

  radioHandler (event) {
    switch (event.target.title) {
      case 'Coinbase':
        return this.props.dispatch(actions.coinBaseSubview())
      case 'ShapeShift':
        return this.props.dispatch(actions.shapeShiftSubview(this.props.provider.type))
    }
  }
}

BuyButtonSubview.propTypes = {
  dispatch: PropTypes.func,
  network: PropTypes.string,
  buyView: PropTypes.object,
  context: PropTypes.string,
  provider: PropTypes.object,
  isContractExecutionByUser: PropTypes.bool,
}

function mapStateToProps (state) {
  return {
    identity: state.appState.identity,
    account: state.metamask.accounts[state.appState.buyView.buyAddress],
    warning: state.appState.warning,
    buyView: state.appState.buyView,
    network: state.metamask.network,
    provider: state.metamask.provider,
    context: state.appState.currentView.context,
    isSubLoading: state.appState.isSubLoading,
    isContractExecutionByUser: state.appState.buyView.isContractExecutionByUser,
  }
}

module.exports = connect(mapStateToProps)(BuyButtonSubview)
