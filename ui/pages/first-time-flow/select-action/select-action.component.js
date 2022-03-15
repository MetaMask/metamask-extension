import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/button';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import { INITIALIZE_METAMETRICS_OPT_IN_ROUTE, INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE, INITIALIZE_CREATE_PASSWORD_ROUTE } from '../../../helpers/constants/routes';

export default class SelectAction extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    isInitialized: PropTypes.bool,
    setFirstTimeFlowType: PropTypes.func,
    nextRoute: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  componentDidMount() {
    const { history, isInitialized, nextRoute } = this.props;

    if (isInitialized) {
      history.push(nextRoute);
    }
  }

  handleCreate = () => {
    this.props.setFirstTimeFlowType('create');
    this.props.history.push(INITIALIZE_CREATE_PASSWORD_ROUTE);
  };

  handleImport = () => {
    this.props.setFirstTimeFlowType('import');
    this.props.history.push(INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE);
  };

  render() {
    const { t } = this.context;

    return (
      <div className="select-action">
        {/* <MetaFoxLogo /> */}

        <div className="select-action__wrapper">
          <div className="select-action__body">

            <img src='./images/alphaCarbon/logo.png' alt="alpha-carbon-logo" />
            <div className="select-action__body-header">
              {t('carbonWallet')}
            </div>
            <div className="select-action__body-header-title">
              {t('extension')}
            </div>
            <div className="select-action__body-header-description">
              <p>{t('createGetStart')}</p>
            </div>
            <div className="select-action__select-buttons">
              <div className="select-action__select-button">
                {/* <div className="select-action__button-content">
                  <div className="select-action__button-symbol">
                    <img src="./images/download-alt.svg" alt="" />
                  </div>
                  <div className="select-action__button-text-big">
                    {t('noAlreadyHaveSeed')}
                  </div>
                  <div className="select-action__button-text-small">
                    {t('importYourExisting')}
                  </div>
                </div> */}
                <Button
                  type="primaryGradient"
                  className="first-time-flow__button"
                  onClick={this.handleImport}
                >
                  {t('importWallet')}
                </Button>
              </div>
              <div className="select-action__select-button">
                {/* <div className="select-action__button-content">
                  <div className="select-action__button-symbol">
                    <img src="./images/thin-plus.svg" alt="" />
                  </div> 
                  <div className="select-action__button-text-big">
                    {t('letsGoSetUp')}
                  </div>
                  <div className="select-action__button-text-small">
                    {t('thisWillCreate')}
                  </div>
                </div> */}
                <Button
                  type="secondaryGradient"
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
