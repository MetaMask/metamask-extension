import { connect } from 'react-redux'
import UniqueImage from './unique-image.component'

const mapStateToProps = ({ metamask }) => {
  const { selectedAddress } = metamask

  return {
    address: selectedAddress,
  }
}

export default connect(mapStateToProps)(UniqueImage)
