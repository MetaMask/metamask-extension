import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  createNewVaultAndRestore,
  unMarkPasswordForgotten,
} from '../../store/actions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import CreateNewVault from '../../components/app/create-new-vault';
import Button from '../../components/ui/button';
import Box from '../../components/ui/box';
import Typography from '../../components/ui/typography';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import {
  TextColor,
  TypographyVariant,
} from '../../helpers/constants/design-system';
import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';

class RestoreVaultPage extends Component {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    createNewVaultAndRestore: PropTypes.func.isRequired,
    leaveImportSeedScreenState: PropTypes.func,
    history: PropTypes.object,
    isLoading: PropTypes.bool,
  };

  handleImport = async (password, seedPhrase) => {
    const {
      // eslint-disable-next-line no-shadow
      createNewVaultAndRestore,
      leaveImportSeedScreenState,
      history,
    } = this.props;

    leaveImportSeedScreenState();
    await createNewVaultAndRestore(password, seedPhrase);
    this.context.trackEvent({
      category: MetaMetricsEventCategory.Retention,
      event: 'onboardingRestoredVault',
      properties: {
        action: 'userEntersSeedPhrase',
        legacy_event: true,
      },
    });
    history.push(DEFAULT_ROUTE);
  };

  render() {
    const { t } = this.context;
    const { isLoading } = this.props;

    return (
      <Box className="first-view-main-wrapper">
        <Box className="first-view-main">
          <Box className="import-account">
            <a
              className="import-account__back-button"
              onClick={(e) => {
                e.preventDefault();
                this.props.leaveImportSeedScreenState();
                this.props.history.push(DEFAULT_ROUTE);
              }}
              href="#"
            >
              {`< ${t('back')}`}
            </a>
            <Typography
              variant={TypographyVariant.H1}
              color={TextColor.textDefault}
            >
              {t('resetWallet')}
            </Typography>
            <Typography color={TextColor.textDefault}>
              {t('resetWalletSubHeader')}
            </Typography>
            <Typography
              color={TextColor.textDefault}
              marginTop={4}
              marginBottom={4}
            >
              {t('resetWalletUsingSRP', [
                <Button
                  type="link"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={ZENDESK_URLS.ADD_MISSING_ACCOUNTS}
                  key="import-account-secretphase"
                  className="import-account__link"
                >
                  {t('reAddAccounts')}
                </Button>,
                <Button
                  type="link"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={ZENDESK_URLS.IMPORT_ACCOUNTS}
                  key="import-account-reimport-accounts"
                  className="import-account__link"
                >
                  {t('reAdded')}
                </Button>,
                <Button
                  type="link"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={ZENDESK_URLS.ADD_CUSTOM_TOKENS}
                  key="import-account-readd-tokens"
                  className="import-account__link"
                >
                  {t('reAdded')}
                </Button>,
              ])}
            </Typography>
            <Typography
              color={TextColor.textDefault}
              margin={0}
              marginBottom={4}
            >
              {t('resetWalletWarning')}
            </Typography>
            <CreateNewVault
              disabled={isLoading}
              onSubmit={this.handleImport}
              submitText={t('restore')}
            />
          </Box>
        </Box>
      </Box>
    );
  }
}

export default connect(
  ({ appState: { isLoading } }) => ({ isLoading }),
  (dispatch) => ({
    leaveImportSeedScreenState: () => {
      dispatch(unMarkPasswordForgotten());
    },
    createNewVaultAndRestore: (pw, seed) =>
      dispatch(createNewVaultAndRestore(pw, seed)),
  }),
)(RestoreVaultPage);
