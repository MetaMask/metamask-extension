import React, { PureComponent } from 'react'
const PropTypes = require('prop-types')
const { connect } = require('react-redux')
const actions = require('../../../../../store/actions')
const EmailScreen = require('./email-screen')

class ConnectTrustVaultEmailForm extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      error: null,
      browserSupported: true,
    }
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
      >

      </EmailScreen>)
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

const mapDispatchToProps = dispatch => ({
  showAlert: msg => dispatch(actions.showAlert(msg)),
  hideAlert: () => dispatch(actions.hideAlert()),
})

ConnectTrustVaultEmailForm.contextTypes = {
  metricsEvent: PropTypes.func,
}

module.exports = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConnectTrustVaultEmailForm)
