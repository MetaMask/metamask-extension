import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import { withRouter, Switch, Route } from 'react-router-dom'
import { compose } from 'recompose'

import CreatePasswordScreen from './create-password-screen'
import UniqueImageScreen from './unique-image-screen'
import NoticeScreen from './notice-screen'
import BackupPhraseScreen from './seed-screen'
import ImportAccountScreen from './import-account-screen'
import ImportSeedPhraseScreen from './import-seed-phrase-screen'
import ConfirmSeed from './confirm-seed-screen'
import {
  INITIALIZE_ROUTE,
  INITIALIZE_IMPORT_ACCOUNT_ROUTE,
  INITIALIZE_UNIQUE_IMAGE_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
  INITIALIZE_NOTICE_ROUTE,
  INITIALIZE_BACKUP_PHRASE_ROUTE,
  INITIALIZE_CONFIRM_SEED_ROUTE,
  INITIALIZE_CREATE_PASSWORD_ROUTE,
} from '../../../../ui/app/routes'
import WelcomeScreen from '../../../../ui/app/welcome-screen'

class FirstTimeFlow extends Component {

  static propTypes = {
    isInitialized: PropTypes.bool,
    seedWords: PropTypes.string,
    address: PropTypes.string,
    noActiveNotices: PropTypes.bool,
    goToBuyEtherView: PropTypes.func,
    isUnlocked: PropTypes.bool,
    history: PropTypes.object,
    welcomeScreenSeen: PropTypes.bool,
    isPopup: PropTypes.bool,
  };

  static defaultProps = {
    isInitialized: false,
    seedWords: '',
    noActiveNotices: false,
  };

  render () {
    return (
      <div className="flex-column flex-grow">
        <div className="first-time-flow">
          <Switch>
            <Route exact path={INITIALIZE_IMPORT_ACCOUNT_ROUTE} component={ImportAccountScreen} />
            <Route
              exact
              path={INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE}
              component={ImportSeedPhraseScreen}
            />
            <Route exact path={INITIALIZE_UNIQUE_IMAGE_ROUTE} component={UniqueImageScreen} />
            <Route exact path={INITIALIZE_NOTICE_ROUTE} component={NoticeScreen} />
            <Route exact path={INITIALIZE_BACKUP_PHRASE_ROUTE} component={BackupPhraseScreen} />
            <Route exact path={INITIALIZE_CONFIRM_SEED_ROUTE} component={ConfirmSeed} />
            <Route exact path={INITIALIZE_CREATE_PASSWORD_ROUTE} component={CreatePasswordScreen} />
            <Route exact path={INITIALIZE_ROUTE} component={WelcomeScreen} />
          </Switch>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ metamask }) => {
  const {
    isInitialized,
    seedWords,
    noActiveNotices,
    selectedAddress,
    forgottenPassword,
    isMascara,
    isUnlocked,
    welcomeScreenSeen,
    isPopup,
  } = metamask

  return {
    isMascara,
    isInitialized,
    seedWords,
    noActiveNotices,
    address: selectedAddress,
    forgottenPassword,
    isUnlocked,
    welcomeScreenSeen,
    isPopup,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(FirstTimeFlow)
