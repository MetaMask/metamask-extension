import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import LoadingScreen from '../../ui/loading-screen';
import { SECOND } from '../../../../shared/constants/time';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import Popover from '../../ui/popover/popover.component';
import {
  ButtonPrimary,
  ButtonSecondary,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../component-library';
import {
  DISPLAY,
  IconColor,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';

export default class LoadingNetworkScreen extends PureComponent {
  state = {
    showErrorScreen: false,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    loadingMessage: PropTypes.string,
    cancelTime: PropTypes.number,
    providerConfig: PropTypes.object,
    providerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    showNetworkDropdown: PropTypes.func,
    setProviderArgs: PropTypes.array,
    setProviderType: PropTypes.func,
    rollbackToPreviousProvider: PropTypes.func,
    isNetworkLoading: PropTypes.bool,
    showDeprecatedRpcUrlWarning: PropTypes.bool,
  };

  componentDidMount = () => {
    this.cancelCallTimeout = setTimeout(
      this.cancelCall,
      this.props.cancelTime || SECOND * 15,
    );
  };

  getConnectingLabel = function (loadingMessage) {
    if (loadingMessage) {
      return loadingMessage;
    }
    const { providerConfig, providerId } = this.props;
    const providerName = providerConfig.type;
    const { t } = this.context;

    switch (providerName) {
      case NETWORK_TYPES.MAINNET:
        return t('connectingToMainnet');
      case NETWORK_TYPES.GOERLI:
        return t('connectingToGoerli');
      case NETWORK_TYPES.SEPOLIA:
        return t('connectingToSepolia');
      case NETWORK_TYPES.LINEA_GOERLI:
        return t('connectingToLineaGoerli');
      case NETWORK_TYPES.LINEA_MAINNET:
        return t('connectingToLineaMainnet');
      default:
        return t('connectingTo', [providerId]);
    }
  };

  renderConnectionFailureNotification = (message, showTryAgain = false) => {
    const { showNetworkDropdown, setProviderArgs, setProviderType } =
      this.props;

    return (
      <Popover
        onClose={() => {
          window.clearTimeout(this.cancelCallTimeout);
          this.setState({ showErrorScreen: false });
        }}
        centerTitle
        title={
          <Icon
            name={IconName.Danger}
            size={IconSize.Xl}
            color={IconColor.warningDefault}
          />
        }
      >
        <Text
          variant={TextVariant.bodyLgMedium}
          textAlign={TextAlign.Center}
          margin={[0, 4, 4, 4]}
        >
          {message}
        </Text>
        <Box display={DISPLAY.FLEX} padding={4} gap={2}>
          <ButtonSecondary
            onClick={() => {
              window.clearTimeout(this.cancelCallTimeout);
              this.setState({ showErrorScreen: false });
              showNetworkDropdown();
            }}
            variant={TextVariant.bodySm}
            block
          >
            {this.context.t('switchNetworks')}
          </ButtonSecondary>
          {showTryAgain ? (
            <ButtonPrimary
              onClick={() => {
                this.setState({ showErrorScreen: false });
                setProviderType(...setProviderArgs);
                window.clearTimeout(this.cancelCallTimeout);
                this.cancelCallTimeout = setTimeout(
                  this.cancelCall,
                  this.props.cancelTime || SECOND * 15,
                );
              }}
              variant={TextVariant.bodySm}
              block
            >
              {this.context.t('tryAgain')}
            </ButtonPrimary>
          ) : null}
        </Box>
      </Popover>
    );
  };

  renderDeprecatedRpcUrlWarning = () => {
    return this.renderConnectionFailureNotification(
      this.context.t('currentRpcUrlDeprecated'),
      false,
    );
  };

  renderErrorScreenContent = () => {
    const { providerConfig } = this.props;
    return this.renderConnectionFailureNotification(
      this.context.t('networkSwitchConnectionError', [providerConfig.nickname]),
      true,
    );
  };

  cancelCall = () => {
    const { isNetworkLoading } = this.props;

    if (isNetworkLoading) {
      this.setState({ showErrorScreen: true });
    }
  };

  componentDidUpdate = (prevProps) => {
    const { providerConfig } = this.props;
    const { providerConfig: prevProvider } = prevProps;
    if (providerConfig.type !== prevProvider.type) {
      window.clearTimeout(this.cancelCallTimeout);
      this.setState({ showErrorScreen: false });
      this.cancelCallTimeout = setTimeout(
        this.cancelCall,
        this.props.cancelTime || SECOND * 15,
      );
    }
  };

  componentWillUnmount = () => {
    window.clearTimeout(this.cancelCallTimeout);
  };

  render() {
    const { rollbackToPreviousProvider, showDeprecatedRpcUrlWarning } =
      this.props;

    let loadingMessageToRender;
    if (this.state.showErrorScreen) {
      loadingMessageToRender = this.renderErrorScreenContent();
    } else if (showDeprecatedRpcUrlWarning) {
      loadingMessageToRender = this.renderDeprecatedRpcUrlWarning();
    } else {
      loadingMessageToRender = this.getConnectingLabel(
        this.props.loadingMessage,
      );
    }

    return (
      <LoadingScreen
        header={
          <div
            className="page-container__header-close"
            onClick={rollbackToPreviousProvider}
          />
        }
        showLoadingSpinner={!this.state.showErrorScreen}
        loadingMessage={loadingMessageToRender}
      />
    );
  }
}
