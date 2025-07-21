import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../../../../store/actions';
import Identicon from '../../../ui/identicon';
import { Button, ButtonVariant, Box } from '../../../component-library';
import {
  Display,
  JustifyContent,
  AlignItems,
  BlockSize,
} from '../../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../../../shared/modules/selectors/networks';

function mapStateToProps(state) {
  return {
    chainId: getCurrentChainId(state),
    token: state.appState.modal.modalState.props.token,
    history: state.appState.modal.modalState.props.history,
    networkConfigurationsByChainId: getNetworkConfigurationsByChainId(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hideModal: () => dispatch(actions.hideModal()),
    hideToken: async (address, networkClientId) => {
      await dispatch(
        actions.ignoreTokens({
          tokensToIgnore: address,
          networkClientId,
        }),
      );
      dispatch(actions.hideModal());
    },
  };
}

class HideTokenConfirmationModal extends Component {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    hideToken: PropTypes.func.isRequired,
    hideModal: PropTypes.func.isRequired,
    chainId: PropTypes.string.isRequired,
    networkConfigurationsByChainId: PropTypes.object.isRequired,
    token: PropTypes.shape({
      symbol: PropTypes.string,
      address: PropTypes.string,
      image: PropTypes.string,
      chainId: PropTypes.string,
    }),
    history: PropTypes.object,
  };

  state = {};

  render() {
    const {
      chainId,
      token,
      hideToken,
      hideModal,
      history,
      networkConfigurationsByChainId,
    } = this.props;
    const { symbol, address, image, chainId: tokenChainId } = token;
    const chainIdToUse = tokenChainId || chainId;

    const chainConfig = networkConfigurationsByChainId[chainIdToUse];
    const { defaultRpcEndpointIndex } = chainConfig;
    const { networkClientId: networkInstanceId } =
      chainConfig.rpcEndpoints[defaultRpcEndpointIndex];

    return (
      <div className="hide-token-confirmation__container">
        <div className="hide-token-confirmation__title">
          {this.context.t('hideTokenPrompt')}
        </div>
        <Identicon
          className="hide-token-confirmation__identicon"
          diameter={45}
          address={address}
          image={image}
        />
        <div className="hide-token-confirmation__symbol">{symbol}</div>
        <div className="hide-token-confirmation__copy">
          {this.context.t('readdToken')}
        </div>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.Center}
          alignItems={AlignItems.Center}
          gap={4}
          marginTop={4}
          width={BlockSize.Full}
        >
          <Button
            variant={ButtonVariant.Secondary}
            block
            data-testid="hide-token-confirmation__cancel"
            onClick={() => hideModal()}
          >
            {this.context.t('cancel')}
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            block
            data-testid="hide-token-confirmation__hide"
            onClick={() => {
              this.context.trackEvent({
                event: MetaMetricsEventName.TokenRemoved,
                category: MetaMetricsEventCategory.Tokens,
                sensitiveProperties: {
                  chain_id: chainId,
                  token_contract_address: address,
                  token_symbol: symbol,
                },
              });
              hideToken(address, networkInstanceId);
              history.push(DEFAULT_ROUTE);
            }}
          >
            {this.context.t('hide')}
          </Button>
        </Box>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(HideTokenConfirmationModal);
