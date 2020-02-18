import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { showAlert, hideAlert } from '../../../../../store/actions'
import { EmailScreen } from './email-screen'

class ConnectTrustVaultEmailForm extends PureComponent {

  state = {
    error: null,
    browserSupported: true,
  }

  renderError () {
    return (
      this.state.error ? (
        <span className="sw-connect__error" >
          {this.state.error}
        </span>
      ) : null
    )
  }
  renderContent () {
    return (
      <EmailScreen
        history={this.props.history}
        browserSupported={this.state.browserSupported}
        getTrustVaultPinChallenge={this.props.getTrustVaultPinChallenge}
      />
    )
  }


  render () {
    return (
      <div>
        {this.renderError()}
        {this.renderContent()}
      </div>
    )
  }
}

ConnectTrustVaultEmailForm.propTypes = {
  getTrustVaultPinChallenge: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
}

const mapStateToProps = ({ metamask: { network } }) => ({ network })

const mapDispatchToProps = (dispatch) => ({
  showAlert: (msg) => dispatch(showAlert(msg)),
  hideAlert: () => dispatch(hideAlert()),
})

ConnectTrustVaultEmailForm.contextTypes = {
  metricsEvent: PropTypes.func,
}

export default connect(mapStateToProps, mapDispatchToProps)(
  ConnectTrustVaultEmailForm
)
