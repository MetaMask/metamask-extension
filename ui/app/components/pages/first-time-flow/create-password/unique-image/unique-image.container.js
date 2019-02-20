import { connect } from 'react-redux'
import { setCompletedOnboarding } from '../../../../../actions'
import UniqueImage from './unique-image.component'

const mapStateToProps = ({ metamask }) => {
  const { selectedAddress } = metamask

  return {
    address: selectedAddress,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    completeOnboarding: () => dispatch(setCompletedOnboarding()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UniqueImage)
