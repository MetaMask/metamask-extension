import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import {
  createNewVaultAndRestore,
  resetOAuthLoginState,
  setFirstTimeFlowType,
  unMarkPasswordForgotten,
} from '../../store/actions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  Box,
  Text,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  ButtonSize,
  Button,
} from '../../components/component-library';
import {
  TextVariant,
  TextColor,
  Display,
  FlexDirection,
  JustifyContent,
  BlockSize,
  IconColor,
  AlignItems,
  TextAlign,
  BorderColor,
  BorderRadius,
} from '../../helpers/constants/design-system';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { getIsSocialLoginFlow } from '../../selectors';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import SrpInputForm from '../srp-input-form';
import CreatePasswordForm from '../create-password-form';
import withRouterHooks from '../../helpers/higher-order-components/with-router-hooks/with-router-hooks';

let isImportingVault = false;

class RestoreVaultPage extends Component {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    createNewVaultAndRestore: PropTypes.func.isRequired,
    leaveImportSeedScreenState: PropTypes.func,
    setFirstTimeFlowType: PropTypes.func,
    resetOAuthLoginState: PropTypes.func,
    navigate: PropTypes.func,
    isSocialLoginFlow: PropTypes.bool,
  };

  state = {
    srpError: '',
    secretRecoveryPhrase: '',
    openSrpDetailsModal: false,
    showPasswordInput: false,
    loading: false,
  };

  componentDidMount() {
    if (isImportingVault) {
      this.setState({
        loading: true,
        showPasswordInput: true,
      });
    }
  }

  handleImport = async (password, termsChecked) => {
    const {
      createNewVaultAndRestore: propsCreateNewVaultAndRestore,
      setFirstTimeFlowType: propsSetFirstTimeFlowType,
      resetOAuthLoginState: propsResetOAuthLoginState,
      leaveImportSeedScreenState,
      navigate,
      isSocialLoginFlow: propsIsSocialLoginFlow,
    } = this.props;

    // For non-social login flows, termsChecked is required
    // For social login flows, termsChecked is optional (used only for marketing consent)
    if (!propsIsSocialLoginFlow && !termsChecked) {
      return;
    }

    isImportingVault = true;

    await new Promise((resolve) => {
      this.setState({ loading: true }, resolve);
    });

    try {
      leaveImportSeedScreenState();

      if (propsIsSocialLoginFlow) {
        // reset oauth and onboarding state
        await propsResetOAuthLoginState();
      }

      // update the first time flow type to restore
      await propsSetFirstTimeFlowType(FirstTimeFlowType.restore);

      // import the seed phrase and create a new vault
      await propsCreateNewVaultAndRestore(
        password,
        this.state.secretRecoveryPhrase,
      );

      this.context.trackEvent({
        category: MetaMetricsEventCategory.Retention,
        event: MetaMetricsEventName.WalletRestored,
      });
      isImportingVault = false;

      navigate(DEFAULT_ROUTE);
    } catch (error) {
      isImportingVault = false;

      this.setState({ loading: false, showPasswordInput: false });
      console.error('[RestoreVault] Error during import:', error);
    }
  };

  handleContinue = () => {
    this.setState((prevState) => ({ ...prevState, showPasswordInput: true }));
  };

  handleBack = () => {
    if (this.state.loading) {
      return;
    }
    this.setState((prevState) => ({ ...prevState, showPasswordInput: false }));
  };

  render() {
    const { t } = this.context;

    const shouldShowPasswordForm =
      this.state.showPasswordInput || this.state.loading;

    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.spaceBetween}
        height={BlockSize.Full}
        gap={4}
        className="import-srp-restore-vault"
        data-testid="import-srp-restore-vault"
        borderRadius={BorderRadius.LG}
        borderColor={BorderColor.borderMuted}
      >
        {shouldShowPasswordForm ? (
          <CreatePasswordForm
            isSocialLoginFlow={false}
            onSubmit={this.handleImport}
            onBack={this.handleBack}
            loading={this.state.loading}
          />
        ) : (
          <>
            <Box>
              <Box marginBottom={4}>
                <ButtonIcon
                  iconName={IconName.ArrowLeft}
                  color={IconColor.iconDefault}
                  size={ButtonIconSize.Md}
                  data-testid="import-srp-back-button"
                  onClick={(e) => {
                    e.preventDefault();
                    this.props.leaveImportSeedScreenState();
                    this.props.navigate(DEFAULT_ROUTE);
                  }}
                  ariaLabel={t('back')}
                />
              </Box>
              <Box textAlign={TextAlign.Left} marginBottom={2}>
                <Text variant={TextVariant.headingLg}>
                  {t('importAWallet')}
                </Text>
              </Box>
              <Box textAlign={TextAlign.Left} marginBottom={4}>
                <Text
                  variant={TextVariant.bodyMd}
                  color={TextColor.textAlternative}
                >
                  {t('restoreWalletDescription', [
                    <Text
                      key="secret-recovery-phrase"
                      variant={TextVariant.bodyMd}
                      color={TextColor.primaryDefault}
                      onClick={() =>
                        this.setState({ openSrpDetailsModal: true })
                      }
                      as="button"
                    >
                      {t('secretRecoveryPhrase')}
                    </Text>,
                  ])}
                </Text>
              </Box>
              <SrpInputForm
                error={this.state.srpError}
                setSecretRecoveryPhrase={(secretRecoveryPhrase) =>
                  this.setState({ secretRecoveryPhrase })
                }
                onClearCallback={() => this.setState({ srpError: '' })}
                showDescription={false}
                openSrpDetailsModal={this.state.openSrpDetailsModal}
                openSrpDetailsModalCallback={() =>
                  this.setState({ openSrpDetailsModal: false })
                }
              />
            </Box>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
              width={BlockSize.Full}
              textAlign={TextAlign.Left}
            >
              <Button
                width={BlockSize.Full}
                size={ButtonSize.Lg}
                type="primary"
                data-testid="import-srp-confirm"
                onClick={this.handleContinue}
                disabled={
                  !this.state.secretRecoveryPhrase.trim() ||
                  Boolean(this.state.srpError)
                }
                className="import-srp__continue-button"
              >
                {t('continue')}
              </Button>
            </Box>
          </>
        )}
      </Box>
    );
  }
}

export default compose(
  withRouterHooks,
  connect(
    (state) => {
      return {
        isLoading: state.appState.isLoading,
        isSocialLoginFlow: getIsSocialLoginFlow(state),
      };
    },
    (dispatch) => ({
      leaveImportSeedScreenState: () => {
        dispatch(unMarkPasswordForgotten());
      },
      createNewVaultAndRestore: (pw, seed) =>
        dispatch(createNewVaultAndRestore(pw, seed)),
      setFirstTimeFlowType: (type) => dispatch(setFirstTimeFlowType(type)),
      resetOAuthLoginState: () => dispatch(resetOAuthLoginState()),
    }),
  ),
)(RestoreVaultPage);
