import EventEmitter from 'events';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Mascot from '../../../components/ui/mascot';
import Button from '../../../components/ui/button';
import {
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_SELECT_ACTION_ROUTE,
} from '../../../helpers/constants/routes';
import { isBeta } from '../../../helpers/utils/build-types';

export default class Welcome extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    participateInMetaMetrics: PropTypes.bool,
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

  handleContinue = () => {
    this.props.history.push(INITIALIZE_SELECT_ACTION_ROUTE);
  };

  getContent() {
    const { t } = this.context;
    return (
      <>
        <div className="welcome-page__header">{t('welcome')}</div>
        <div className="welcome-page__description">
          <p>{t('metamaskDescription')}</p>
          <p>{t('happyToSeeYou')}</p>
        </div>
      </>
    );
  }

  getBetaContent() {
    const { t } = this.context;
    return (
      <>
        <div className="welcome-page__header">{t('betaWelcome')}</div>
        <div className="welcome-page__description">
          <p>{t('betaMetamaskDescription')}</p>
          <p>
            {t('betaMetamaskDescriptionExplanation', [
              <a href="https://metamask.io/terms.html" key="terms-link">
                {t('betaMetamaskDescriptionExplanationTermsLinkText')}
              </a>,
              <a
                href="https://metamask.io/beta-terms.html"
                key="beta-terms-link"
              >
                {t('betaMetamaskDescriptionExplanationBetaTermsLinkText')}
              </a>,
            ])}
          </p>
        </div>
      </>
    );
  }

  render() {
    const { t } = this.context;

    return (
      <div className="welcome-page__wrapper">
        <div className="welcome-page">
          <Mascot
            animationEventEmitter={this.animationEventEmitter}
            width="125"
            height="125"
          />
          {isBeta() ? this.getBetaContent() : this.getContent()}
          <Button
            type="primary"
            className="first-time-flow__button"
            onClick={this.handleContinue}
          >
            {t('getStarted')}
          </Button>
        </div>
      </div>
    );
  }
}
