import React, { PureComponent } from 'react'
import { Switch, Route } from 'react-router-dom'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { getTrustVaultPinChallenge } from '../../../../store/actions'
import ConnectTrustVaultEmailForm from './email'
import ConnectTrustVaultPinForm from './pin'

const {
  TRUSTVAULT_EMAIL_ROUTE,
  TRUSTVAULT_PIN_ROUTE,
  DEFAULT_ROUTE,
} = require('../../../../helpers/constants/routes')

class ConnectTrustVaultForm extends PureComponent {
  static propTypes = {
    getTrustVaultPinChallenge: PropTypes.func,
    history: PropTypes.object,
  }
  constructor (props) {
    super(props)
    this.state = {
      error: null,
      browserSupported: true,
      pinChallenge: null,
      email: null,
    }
  }

  getTrustVaultPinChallenge = async (email) => {
    try {
      const pinChallenge = await this.props.getTrustVaultPinChallenge(email)
      this.setState({
        pinChallenge,
        email,
        error: pinChallenge ? null : this.state.error,
      })
    } catch (e) {
      this.setState({ pinChallenge: null, email, error: e.message })
    }
  }

  goToHomePage () {
    this.props.history.push(DEFAULT_ROUTE)
  }

  onCancelLogin = () => {
    this.setState({ pinChallenge: null })
  }

  renderError () {
    return (this.state.error ? (
      <span className="sw-connect__error">
        {this.state.error}
      </span>
    ) : null)

  }

  goToHomePage = () => {
    this.props.history.push(DEFAULT_ROUTE)
  }

  onCancelLogin = () => {
    this.setState({ pinChallenge: null, error: null })
  }

  onNewPinChallenge = (pinChallenge, error) => {
    this.setState({ pinChallenge, error })
  }

  renderEmailForm = () => {
    return (
      <ConnectTrustVaultEmailForm
        history={this.props.history}
        getTrustVaultPinChallenge={this.getTrustVaultPinChallenge}
      />
    )
  }

  renderPinForm = () => {
    // Remove the error message
    return (
      <ConnectTrustVaultPinForm
        browserSupported={this.state.browserSupported}
        history={this.props.history}
        pinChallenge={this.state.pinChallenge}
        email={this.state.email}
        onCancelLogin={this.onCancelLogin}
        goToHomePage={this.goToHomePage}
        onNewPinChallenge={this.onNewPinChallenge}
      >

      </ConnectTrustVaultPinForm>
    )

  }

  render = () => {
    return (
      <div className="new-account__header">
        <div className="trustvault-connect">
          {this.renderError()}
          {!this.state.pinChallenge ? this.renderEmailForm() : this.renderPinForm()}
          <Switch>
            <Route exact path={TRUSTVAULT_EMAIL_ROUTE} component={ConnectTrustVaultEmailForm} />
            <Route exact path={TRUSTVAULT_PIN_ROUTE} component={ConnectTrustVaultPinForm} />
          </Switch>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  displayedForm: state.appState.currentView.context,
})

const mapDispatchToProps = (dispatch) => ({
  getTrustVaultPinChallenge: (email) => dispatch(getTrustVaultPinChallenge(email)),
})

export default connect(mapStateToProps, mapDispatchToProps)(
  ConnectTrustVaultForm
)
