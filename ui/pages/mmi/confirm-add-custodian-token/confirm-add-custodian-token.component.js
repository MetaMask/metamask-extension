import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/ui/button';
import PulseLoader from '../../components/ui/pulse-loader';
import { CUSTODY_ACCOUNT_ROUTE } from '../../helpers/constants/routes';
import { BUILT_IN_NETWORKS } from '../../../shared/constants/network';

export default class ConfirmAddCustodianToken extends Component {
  state = {
    showMore: false,
    isLoading: false,
    connectError: '',
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    removeAddTokenConnectRequest: PropTypes.func,
    setCustodianConnectRequest: PropTypes.func,
    connectRequests: PropTypes.arrayOf(PropTypes.object),
    setProviderType: PropTypes.func,
  };

  handleConnectError(e) {
    let connectError = e.message;
    if (!connectError) {
      connectError = 'Connection error';
    }
    this.setState({ connectError, isLoading: false });
  }

  renderSelectedToken() {
    const { showMore } = this.state;
    const { connectRequests } = this.props;
    const connectRequest = connectRequests ? connectRequests[0] : undefined;
    return (
      <div className="selected-token-wrapper">
        <span>
          {showMore && connectRequest?.token
            ? connectRequest?.token
            : `...${connectRequest?.token.slice(-9)}`}
        </span>
        {!showMore && (
          <div className="confirm-action-jwt__show-more">
            <a
              rel="noopener noreferrer"
              onClick={() => {
                this.setState({ showMore: true });
              }}
            >
              Show more
            </a>
          </div>
        )}
      </div>
    );
  }

  render() {
    const {
      history,
      mostRecentOverviewPage,
      removeAddTokenConnectRequest,
      setCustodianConnectRequest,
      connectRequests,
      setProviderType,
    } = this.props;
    const connectRequest = connectRequests ? connectRequests[0] : undefined;
    if (!connectRequest) {
      history.push(mostRecentOverviewPage);
      return null;
    }

    this.context.trackEvent({
      category: 'MMI',
      event: 'Custodian onboarding',
      properties: {
        actions: 'Custodian RPC request',
        custodian: connectRequest.custodian,
        apiUrl: connectRequest.apiUrl,
      },
    });

    let custodianLabel = '';
    if (
      connectRequest.labels &&
      connectRequest.labels.some((label) => label.key === 'service')
    ) {
      custodianLabel = connectRequest.labels.find(
        (label) => label.key === 'service',
      ).value;
    }

    return (
      <div className="page-container">
        <div className="page-container__header">
          <div className="page-container__title">Custodian Account</div>
          <div className="page-container__subtitle">
            {this.context.t('mmiAddToken', [connectRequest.origin])}
          </div>
        </div>
        <div className="page-container__content">
          {custodianLabel && (
            <>
              <div className="add_custodian_token_spacing">Custodian</div>
              <div className="add_custodian_token_confirm__url">
                {custodianLabel}
              </div>
            </>
          )}

          <div className="add_custodian_token_spacing">Token</div>
          <div className="add_custodian_token_confirm__token">
            {this.renderSelectedToken()}
          </div>
          {connectRequest.apiUrl && (
            <>
              <div className="add_custodian_token_spacing">API URL</div>
              <div className="add_custodian_token_confirm__url">
                {connectRequest.apiUrl}
              </div>
            </>
          )}
        </div>

        {!this.state.complianceActivated && (
          <div
            className="add_custodian_token_confirm__error"
            data-testid="connect-custodian-token-error"
          >
            <p className="error">{this.state.connectError}</p>
          </div>
        )}

        <div className="page-container__footer">
          {this.state.isLoading ? (
            <footer>
              <PulseLoader />
            </footer>
          ) : (
            <footer>
              <Button
                type="default"
                large
                className="page-container__footer-button"
                onClick={() => {
                  removeAddTokenConnectRequest({
                    origin: connectRequest.origin,
                    apiUrl: connectRequest.apiUrl,
                    token: connectRequest.token,
                  });
                  history.push(mostRecentOverviewPage);

                  this.context.trackEvent({
                    category: 'MMI',
                    event: 'Custodian onboarding',
                    properties: {
                      actions: 'Custodian RPC cancel',
                      custodian: connectRequest.custodian,
                      apiUrl: connectRequest.apiUrl,
                    },
                  });
                }}
              >
                {this.context.t('cancel')}
              </Button>
              <Button
                type="primary"
                large
                className="page-container__footer-button"
                onClick={async () => {
                  this.setState({ connectError: '', isLoading: true });

                  try {
                    if (connectRequest.chainId) {
                      const networkType = Object.keys(BUILT_IN_NETWORKS).find(
                        (key) =>
                          Number(BUILT_IN_NETWORKS[key].chainId).toString(
                            10,
                          ) === connectRequest.chainId.toString(),
                      );
                      await setProviderType(networkType);
                    }

                    // @shane-t
                    // all custodian names are lower case, but Jupiter sends `Jupiter` as the service

                    let custodianName = connectRequest.service.toLowerCase();

                    if (connectRequest.service === 'JSONRPC') {
                      custodianName = connectRequest.environment;
                    }

                    await setCustodianConnectRequest({
                      token: connectRequest.token,
                      apiUrl: connectRequest.apiUrl,
                      custodianName,
                      custodianType: connectRequest.service,
                    });

                    removeAddTokenConnectRequest({
                      origin: connectRequest.origin,
                      apiUrl: connectRequest.apiUrl,
                      token: connectRequest.token,
                    });

                    this.context.trackEvent({
                      category: 'MMI',
                      event: 'Custodian onboarding',
                      properties: {
                        actions: 'Custodian RPC confirm',
                        custodian: connectRequest.custodian,
                        apiUrl: connectRequest.apiUrl,
                      },
                    });

                    history.push(CUSTODY_ACCOUNT_ROUTE);
                  } catch (e) {
                    this.handleConnectError(e);
                  }
                }}
              >
                {this.context.t('confirm')}
              </Button>
            </footer>
          )}
        </div>
      </div>
    );
  }
}
