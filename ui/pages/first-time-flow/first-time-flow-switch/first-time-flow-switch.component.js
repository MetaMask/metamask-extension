import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import {
  DEFAULT_ROUTE,
  LOCK_ROUTE,
  INITIALIZE_END_OF_FLOW_ROUTE,
  INITIALIZE_UNLOCK_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  INITIALIZE_EXPERIMENTAL_AREA,
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(main,beta)
  INITIALIZE_WELCOME_ROUTE,
  ///: END:ONLY_INCLUDE_IN
} from '../../../helpers/constants/routes';

export default class FirstTimeFlowSwitch extends PureComponent {
  static propTypes = {
    completedOnboarding: PropTypes.bool,
    isInitialized: PropTypes.bool,
    isUnlocked: PropTypes.bool,
    seedPhraseBackedUp: PropTypes.bool,
  };

  render() {
    const {
      completedOnboarding,
      isInitialized,
      isUnlocked,
      seedPhraseBackedUp,
    } = this.props;

    if (completedOnboarding) {
      return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
    }

    if (seedPhraseBackedUp !== null) {
      return <Redirect to={{ pathname: INITIALIZE_END_OF_FLOW_ROUTE }} />;
    }

    if (isUnlocked) {
      return <Redirect to={{ pathname: LOCK_ROUTE }} />;
    }

    if (!isInitialized) {
      /* eslint-disable prefer-const */
      let redirect;
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      redirect = <Redirect to={{ pathname: INITIALIZE_EXPERIMENTAL_AREA }} />;
      ///: END:ONLY_INCLUDE_IN
      ///: BEGIN:ONLY_INCLUDE_IN(main,beta)
      redirect = <Redirect to={{ pathname: INITIALIZE_WELCOME_ROUTE }} />;
      ///: END:ONLY_INCLUDE_IN
      /* eslint-enable prefer-const */
      return redirect;
    }

    return <Redirect to={{ pathname: INITIALIZE_UNLOCK_ROUTE }} />;
  }
}
