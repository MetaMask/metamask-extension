import { connect } from 'react-redux'
import SeedPhrase from './seed-phrase.component'

const mapStateToProps = state => {
  const { metamask: { selectedAddress } } = state

  return {
    address: selectedAddress,
  }
}

export default connect(mapStateToProps)(SeedPhrase)
