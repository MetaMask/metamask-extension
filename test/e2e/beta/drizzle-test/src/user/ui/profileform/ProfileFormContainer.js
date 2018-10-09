import { connect } from 'react-redux'
import ProfileForm from './ProfileForm'
import { updateUser } from './ProfileFormActions'

const mapStateToProps = (state, ownProps) => {
  return {
    name: state.user.data.name
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onProfileFormSubmit: (name) => {
      event.preventDefault();

      dispatch(updateUser(name))
    }
  }
}

const ProfileFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ProfileForm)

export default ProfileFormContainer
