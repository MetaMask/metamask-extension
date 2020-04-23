const Component = require('react').Component
const h = require('react-hyperscript')
import PropTypes from 'prop-types'
import TokenTracker from 'eth-token-watcher'
import { connect } from 'react-redux'
const selectors = require('../../../ui/app/selectors')
import log from 'loglevel'

class TokenBalance extends Component {
  static propTypes = {
    dimStyle: PropTypes.object,
    valueStyle: PropTypes.object,
    fontSize: PropTypes.string,
    token: PropTypes.object,
    userAddress: PropTypes.string,
  }

  constructor () {
    super()
    this.state = {
      string: '',
      symbol: '',
      isLoading: true,
      error: null,
    }
    Component.call(this)
  }

  render () {
    const state = this.state
    const props = this.props
    const { string, isLoading } = state

    const valueStyle = props.valueStyle ? props.valueStyle : {
      color: '#ffffff',
      width: '100%',
      fontSize: props.fontSize || '14px',
      textAlign: 'right',
    }
    const dimStyle = props.dimStyle ? props.dimStyle : {
      color: ' #60db97',
      fontSize: props.fontSize || '14px',
      marginLeft: '5px',
    }

    return isLoading
      ? h('div', '')
      : h('.flex-row', {
          style: {
            alignItems: 'flex-end',
            lineHeight: '20px',
            textRendering: 'geometricPrecision',
          },
        }, [
        h('div.hide-text-overflow.token-balance__amount', {
            style: valueStyle,
        }, string),
        h('span.token-balance__symbol', {
            style: dimStyle,
        }, this.state.symbol),
      ])
  }

  componentDidMount () {
    this.createFreshTokenTracker()
  }

  createFreshTokenTracker () {
    if (this.tracker) {
      // Clean up old trackers when refreshing:
      this.tracker.stop()
      this.tracker.removeListener('update', this.balanceUpdater)
      this.tracker.removeListener('error', this.showError)
    }

    if (!global.ethereumProvider) return
    const { userAddress, token } = this.props

    this.tracker = new TokenTracker({
      userAddress,
      provider: global.ethereumProvider,
      tokens: [token],
      pollingInterval: 8000,
    })


    // Set up listener instances for cleaning up
    this.balanceUpdater = this.updateBalance.bind(this)
    this.showError = error => {
      this.setState({ error, isLoading: false })
    }
    this.tracker.on('update', this.balanceUpdater)
    this.tracker.on('error', this.showError)

    this.tracker.updateBalances()
      .then(() => {
        this.updateBalance(this.tracker.serialize())
      })
      .catch((reason) => {
        log.error(`Problem updating balances`, reason)
        this.setState({ isLoading: false })
      })
  }

  componentDidUpdate (nextProps) {
    const {
      userAddress: oldAddress,
      token: { address: oldTokenAddress },
    } = this.props
    const {
      userAddress: newAddress,
      token: { address: newTokenAddress },
    } = nextProps

    if ((!oldAddress || !newAddress) && (!oldTokenAddress || !newTokenAddress)) return
    if ((oldAddress === newAddress) && (oldTokenAddress === newTokenAddress)) return

    this.setState({ isLoading: true })
    this.createFreshTokenTracker()
  }

  updateBalance (tokens = []) {
    if (!this.tracker.running) {
      return
    }

    const [{ string, symbol }] = tokens

    this.setState({
      string,
      symbol,
      isLoading: false,
    })
  }

  componentWillUnmount () {
    if (!this.tracker) return
    this.tracker.stop()
    this.tracker.removeListener('update', this.balanceUpdater)
    this.tracker.removeListener('error', this.showError)
  }

}

function mapStateToProps (state) {
  return {
    userAddress: selectors.getSelectedAddress(state),
  }
}

module.exports = connect(mapStateToProps)(TokenBalance)
