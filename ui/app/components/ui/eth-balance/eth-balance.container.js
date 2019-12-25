import { connect } from 'react-redux'
import EthBalance from './eth-balance.component'

function mapStateToProps (state) {
  return {
    ticker: state.metamask.ticker,
  }
}

export default connect(mapStateToProps)(EthBalance)
