import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  INITIALIZE_SELECT_ACTION_ROUTE,
  INITIALIZE_END_OF_FLOW_ROUTE,
} from '../../../../helpers/constants/routes';
import CreateNewVault from '../../../../components/app/create-new-vault';

export default class ImportWithSeedPhrase extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    setSeedPhraseBackedUp: PropTypes.func,
    initializeThreeBox: PropTypes.func,
  };

  UNSAFE_componentWillMount() {
    this._onBeforeUnload = () =>
      this.context.metricsEvent({
        eventOpts: {
          category: 'Onboarding',
          action: 'Import Seed Phrase',
          name: 'Close window on import screen',
        },
        customVariables: {
          errorLabel: 'Seed Phrase Error',
          errorMessage: this.state.seedPhraseError,
        },
      });
    window.addEventListener('beforeunload', this._onBeforeUnload);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this._onBeforeUnload);
  }

  handleImport = async (password, seedPhrase) => {
    const {
      history,
      onSubmit,
      setSeedPhraseBackedUp,
      initializeThreeBox,
    } = this.props;

    await onSubmit(password, seedPhrase);
    this.context.metricsEvent({
      eventOpts: {
        category: 'Onboarding',
        action: 'Import Seed Phrase',
        name: 'Import Complete',
      },
    });

    setSeedPhraseBackedUp(true).then(async () => {
      initializeThreeBox();
      history.replace(INITIALIZE_END_OF_FLOW_ROUTE);
    });
  };

  render() {
    const { t } = this.context;

    return (
      <div className="first-time-flow__import">
        <div className="first-time-flow__create-back">
          <a
            onClick={(e) => {
              e.preventDefault();
              this.context.metricsEvent({
                eventOpts: {
                  category: 'Onboarding',
                  action: 'Import Seed Phrase',
                  name: 'Go Back from Onboarding Import',
                },
              });
              this.props.history.push(INITIALIZE_SELECT_ACTION_ROUTE);
            }}
            href="#"
          >
            {`< ${t('back')}`}
          </a>
        </div>
        <div className="first-time-flow__header">
          {t('importAccountSeedPhrase')}
        </div>
        <div className="first-time-flow__text-block">{t('secretPhrase')}</div>
        <CreateNewVault
          includeTerms
          onSubmit={this.handleImport}
          submitText={t('import')}
        />
      </div>
    );
  }
}
