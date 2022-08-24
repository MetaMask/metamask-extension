import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/button';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import { EVENT } from '../../../../shared/constants/metametrics';
import {
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
} from '../../../helpers/constants/routes';

export default class SelectAction extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    isInitialized: PropTypes.bool,
    setFirstTimeFlowType: PropTypes.func,
    nextRoute: PropTypes.string,
    metaMetricsId: PropTypes.string,
  };

  static contextTypes = {
    trackEvent: PropTypes.func,
    t: PropTypes.func,
  };

  componentDidMount() {
    const { history, isInitialized, nextRoute } = this.props;

    if (isInitialized) {
      history.push(nextRoute);
    }
  }

  handleCreate = () => {
    const { metaMetricsId } = this.props;
    const { trackEvent } = this.context;
    this.props.setFirstTimeFlowType('create');
    trackEvent(
      {
        category: EVENT.CATEGORIES.ONBOARDING,
        event: 'Selected Create New Wallet',
        properties: {
          action: 'Import or Create',
          legacy_event: true,
        },
      },
      {
        isOptIn: true,
        metaMetricsId,
        flushImmediately: true,
      },
    );
    this.props.history.push(INITIALIZE_CREATE_PASSWORD_ROUTE);
  };

  handleImport = () => {
    const { metaMetricsId } = this.props;
    const { trackEvent } = this.context;
    this.props.setFirstTimeFlowType('import');
    trackEvent(
      {
        category: EVENT.CATEGORIES.ONBOARDING,
        event: 'Selected Import Wallet',
        properties: {
          action: 'Import or Create',
          legacy_event: true,
        },
      },
      {
        isOptIn: true,
        metaMetricsId,
        flushImmediately: true,
      },
    );
    this.props.history.push(INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE);
  };

  render() {
    const { t } = this.context;

    return (
      <div className="select-action">
        <MetaFoxLogo />

        <div className="select-action__wrapper">
          <div className="select-action__body">
            <div className="select-action__body-header">
              {t('newToMetaMask')}
            </div>
            <div className="select-action__select-buttons">
              <div className="select-action__select-button">
                <div className="select-action__button-content">
                  <div className="select-action__button-symbol">
                    <i className="fa fa-download fa-2x" />
                  </div>
                  <div className="select-action__button-text-big">
                    {t('noAlreadyHaveSeed')}
                  </div>
                  <div className="select-action__button-text-small">
                    {t('importYourExisting')}
                  </div>
                </div>
                <Button
                  type="primary"
                  className="first-time-flow__button"
                  onClick={this.handleImport}
                >
                  {t('importWallet')}
                </Button>
              </div>
              <div className="select-action__select-button">
                <div className="select-action__button-content">
                  <div className="select-action__button-symbol">
                    <i className="fa fa-plus fa-2x" />
                  </div>
                  <div className="select-action__button-text-big">
                    {t('letsGoSetUp')}
                  </div>
                  <div className="select-action__button-text-small">
                    {t('thisWillCreate')}
                  </div>
                </div>
                <Button
                  type="primary"
                  className="first-time-flow__button"
                  onClick={this.handleCreate}
                >
                  {t('createAWallet')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
