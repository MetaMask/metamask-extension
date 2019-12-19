import React, { PureComponent } from 'react'
const { Switch, Route } = require('react-router-dom')
const PropTypes = require('prop-types')
const { connect } = require('react-redux')
const actions = require('../../../../store/actions')
const { getCurrentViewContext } = require('../../../../selectors/selectors')
const ConnectTrustVaultEmailForm = require('./email')
const ConnectTrustVaultPinForm = require('./pin')
const {
  TRUSTVAULT_EMAIL_ROUTE,
  TRUSTVAULT_PIN_ROUTE,
  DEFAULT_ROUTE,
} = require('../../../../helpers/constants/routes')

class ConnectTrustVaultForm extends PureComponent {
  static propTypes = {
    getTrustVaultPinChallenge: PropTypes.func,
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

  getTrustVaultPinChallenge = async email => {
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
      >
      </ConnectTrustVaultEmailForm>
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
            <Route exact path={TRUSTVAULT_EMAIL_ROUTE} component={ConnectTrustVaultEmailForm} >

            </Route>
            <Route exact path={TRUSTVAULT_PIN_ROUTE} component={ConnectTrustVaultPinForm} >

            </Route>
          </Switch>

        </div>

      </div>
    )
  }
}

ConnectTrustVaultForm.propTypes = {
  history: PropTypes.object,
}

const mapStateToProps = state => ({
  displayedForm: getCurrentViewContext(state),
})

const mapDispatchToProps = dispatch => ({
  getTrustVaultPinChallenge: email => dispatch(actions.getTrustVaultPinChallenge(email)),
})

module.exports = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConnectTrustVaultForm)

