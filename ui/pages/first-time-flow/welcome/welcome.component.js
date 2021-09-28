import EventEmitter from 'events';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Mascot from '../../../components/ui/mascot';
import Button from '../../../components/ui/button';
import {
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_SELECT_ACTION_ROUTE,
  INITIALIZE_METAMETRICS_OPT_IN_ROUTE,
} from '../../../helpers/constants/routes';
import { isBeta } from '../../../helpers/utils/build-types';
import WelcomeFooter from './welcome-footer.component';
import BetaWelcomeFooter from './beta-welcome-footer.component';

export default class Welcome extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    participateInMetaMetrics: PropTypes.bool,
    setFirstTimeFlowType: PropTypes.func,
    welcomeScreenSeen: PropTypes.bool,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.animationEventEmitter = new EventEmitter();
  }

  componentDidMount() {
    const { history, participateInMetaMetrics, welcomeScreenSeen } = this.props;

    if (welcomeScreenSeen && participateInMetaMetrics !== null) {
      history.push(INITIALIZE_CREATE_PASSWORD_ROUTE);
    } else if (welcomeScreenSeen) {
      history.push(INITIALIZE_SELECT_ACTION_ROUTE);
    }
  }

  handleCreate = () => {
    this.props.setFirstTimeFlowType('create');
    this.props.history.push(INITIALIZE_METAMETRICS_OPT_IN_ROUTE);
  };

  handleImport = () => {
    this.props.setFirstTimeFlowType('import');
    this.props.history.push(INITIALIZE_METAMETRICS_OPT_IN_ROUTE);
  };

  render() {
    const { t } = this.context;

    return (
      <div className="welcome-page__wrapper">
        <div className="welcome-page">
          {isBeta() ? <BetaWelcomeFooter /> : <WelcomeFooter />}
          <Mascot
            animationEventEmitter={this.animationEventEmitter}
            width="125"
            height="125"
          />
          <ul>
            <li>
              <Button
                type="primary"
                className="first-time-flow__button"
                onClick={this.handleCreate}
              >
                {t('onboardingCreateWallet')}
              </Button>
            </li>
            <li>
              <Button
                type="primary"
                className="first-time-flow__button"
                onClick={this.handleImport}
              >
                {t('onboardingImportWallet')}
              </Button>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}
