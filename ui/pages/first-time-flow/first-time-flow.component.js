import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Switch, Route } from 'react-router-dom';
import Unlock from '../unlock-page';
import {
  DEFAULT_ROUTE,
  INITIALIZE_WELCOME_ROUTE,
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_SEED_PHRASE_ROUTE,
  INITIALIZE_UNLOCK_ROUTE,
  INITIALIZE_SELECT_ACTION_ROUTE,
  INITIALIZE_END_OF_FLOW_ROUTE,
  INITIALIZE_METAMETRICS_OPT_IN_ROUTE,
  INITIALIZE_BACKUP_SEED_PHRASE_ROUTE,
  INITIALIZE_SEED_PHRASE_INTRO_ROUTE,
} from '../../helpers/constants/routes';
import FirstTimeFlowSwitch from './first-time-flow-switch';
import Welcome from './welcome';
import SelectAction from './select-action';
import EndOfFlow from './end-of-flow';
import CreatePassword from './create-password';
import SeedPhrase from './seed-phrase';
import MetaMetricsOptInScreen from './metametrics-opt-in';

export default class FirstTimeFlow extends PureComponent {
  static propTypes = {
    completedOnboarding: PropTypes.bool,
    createNewAccount: PropTypes.func,
    createNewAccountFromSeed: PropTypes.func,
    history: PropTypes.object,
    isInitialized: PropTypes.bool,
    isUnlocked: PropTypes.bool,
    unlockAccount: PropTypes.func,
    nextRoute: PropTypes.string,
    showingSeedPhraseBackupAfterOnboarding: PropTypes.bool,
    seedPhraseBackedUp: PropTypes.bool,
    verifySeedPhrase: PropTypes.func,
  };

  state = {
    seedPhrase: '',
  };

  componentDidMount() {
    const {
      completedOnboarding,
      history,
      isInitialized,
      isUnlocked,
      showingSeedPhraseBackupAfterOnboarding,
      seedPhraseBackedUp,
    } = this.props;

    if (
      completedOnboarding &&
      (!showingSeedPhraseBackupAfterOnboarding || seedPhraseBackedUp)
    ) {
      history.push(DEFAULT_ROUTE);
      return;
    }

    if (isInitialized && !isUnlocked) {
      history.push(INITIALIZE_UNLOCK_ROUTE);
    }
  }

  handleCreateNewAccount = async (password) => {
    const { createNewAccount } = this.props;

    try {
      const seedPhrase = await createNewAccount(password);
      this.setState({ seedPhrase });
    } catch (error) {
      throw new Error(error.message);
    }
  };

  handleImportWithSeedPhrase = async (password, seedPhrase) => {
    const { createNewAccountFromSeed } = this.props;

    try {
      const vault = await createNewAccountFromSeed(password, seedPhrase);
      return vault;
    } catch (error) {
      throw new Error(error.message);
    }
  };

  handleUnlock = async (password) => {
    const { unlockAccount, history, nextRoute } = this.props;

    try {
      const seedPhrase = await unlockAccount(password);
      this.setState({ seedPhrase }, () => {
        history.push(nextRoute);
      });
    } catch (error) {
      throw new Error(error.message);
    }
  };

  render() {
    const { seedPhrase } = this.state;
    const { verifySeedPhrase } = this.props;

    return (
      <div className="first-time-flow">
        <Switch>
          <Route
            path={INITIALIZE_SEED_PHRASE_ROUTE}
            render={(routeProps) => (
              <SeedPhrase
                {...routeProps}
                seedPhrase={seedPhrase}
                verifySeedPhrase={verifySeedPhrase}
              />
            )}
          />
          <Route
            path={INITIALIZE_BACKUP_SEED_PHRASE_ROUTE}
            render={(routeProps) => (
              <SeedPhrase
                {...routeProps}
                seedPhrase={seedPhrase}
                verifySeedPhrase={verifySeedPhrase}
              />
            )}
          />
          <Route
            path={INITIALIZE_SEED_PHRASE_INTRO_ROUTE}
            render={(routeProps) => (
              <SeedPhrase
                {...routeProps}
                seedPhrase={seedPhrase}
                verifySeedPhrase={verifySeedPhrase}
              />
            )}
          />
          <Route
            path={INITIALIZE_CREATE_PASSWORD_ROUTE}
            render={(routeProps) => (
              <CreatePassword
                {...routeProps}
                onCreateNewAccount={this.handleCreateNewAccount}
                onCreateNewAccountFromSeed={this.handleImportWithSeedPhrase}
              />
            )}
          />
          <Route
            path={INITIALIZE_SELECT_ACTION_ROUTE}
            component={SelectAction}
          />
          <Route
            path={INITIALIZE_UNLOCK_ROUTE}
            render={(routeProps) => (
              <Unlock {...routeProps} onSubmit={this.handleUnlock} />
            )}
          />
          <Route
            exact
            path={INITIALIZE_END_OF_FLOW_ROUTE}
            component={EndOfFlow}
          />
          <Route exact path={INITIALIZE_WELCOME_ROUTE} component={Welcome} />
          <Route
            exact
            path={INITIALIZE_METAMETRICS_OPT_IN_ROUTE}
            component={MetaMetricsOptInScreen}
          />
          <Route exact path="*" component={FirstTimeFlowSwitch} />
        </Switch>
      </div>
    );
  }
}
