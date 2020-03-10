import { connect } from 'react-redux'
import Initialized from './initialized.component'

const mapStateToProps = (state) => {
  const {
    metamask: { completedOnboarding },
  } = state

  return {
    completedOnboarding,
  }
}

export default connect(mapStateToProps)(Initialized)
