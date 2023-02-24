import React, { Component } from 'react';
import PropTypes from 'prop-types';
import copy from 'copy-to-clipboard';
import Button from '../../components/ui/button';
import CustodyLabels from '../../components/ui/custody-labels';
import PulseLoader from '../../components/ui/pulse-loader';
import { INSTITUTIONAL_FEATURES_DONE_ROUTE } from '../../helpers/constants/routes';
import { MAINNET_DEFAULT_BLOCK_EXPLORER_URL } from '../../../shared/constants/swaps';
import { SECOND } from '../../../shared/constants/time';
import { shortenAddress } from '../../helpers/utils/util';
import Tooltip from '../../components/ui/tooltip';
import CopyIcon from '../../components/ui/icon/copy-icon.component';
import OpenInNewTab from '../../components/ui/icon/open-in-new-tab.component';

export default class InteractiveReplacementTokenPage extends Component {
  _isMounted = false;

  state = {
    isLoading: false,
    tokenAccounts: [],
    copied: false,
    error: false,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    metaMaskAccounts: PropTypes.object,
    mostRecentOverviewPage: PropTypes.string,
    removeAddTokenConnectRequest: PropTypes.func,
    setCustodianNewRefreshToken: PropTypes.func,
    connectRequests: PropTypes.arrayOf(PropTypes.object),
    showInteractiveReplacementTokenBanner: PropTypes.func,
    custodian: PropTypes.object,
    getCustodianAccounts: PropTypes.func,
    url: PropTypes.string,
  };

  componentDidMount() {
    this._isMounted = true;
    this.getTokenAccounts();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  getTokenAccounts = async () => {
    const {
      connectRequests,
      metaMaskAccounts,
      history,
      mostRecentOverviewPage,
    } = this.props;
    const connectRequest = connectRequests ? connectRequests[0] : undefined;

    if (!connectRequest) {
      history.push(mostRecentOverviewPage);
      return;
    }

    try {
      const custodianAccounts = await this.props.getCustodianAccounts(
        connectRequest.token,
        connectRequest.apiUrl,
        connectRequest.service,
        false,
      );

      const tokenAccounts = custodianAccounts
        .filter((account) => metaMaskAccounts[account.address.toLowerCase()])
        .map((account) => ({
          address: account.address,
          name: account.name,
          labels: account.labels,
          balance: metaMaskAccounts[account.address.toLowerCase()]?.balance,
        }));

      if (this._isMounted) {
        this.setState({ tokenAccounts, isLoading: false });
      }
    } catch (e) {
      this.setState({
        error: true,
        isLoading: false,
      });
    }
  };

  removeAddTokenConnectRequest = ({ origin, apiUrl, token }) => {
    this.props.removeAddTokenConnectRequest({
      origin,
      apiUrl,
      token,
    });
  };

  handleReject = () => {
    const { connectRequests, history, mostRecentOverviewPage } = this.props;

    this.removeAddTokenConnectRequest(connectRequests[0]);
    history.push(mostRecentOverviewPage);
  };

  handleApprove = async () => {
    const {
      url,
      custodian,
      connectRequests,
      setCustodianNewRefreshToken,
      showInteractiveReplacementTokenBanner,
      history,
    } = this.props;

    const connectRequest = connectRequests[0];

    if (this.state.error) {
      global.platform.openTab({
        url,
      });
      this.handleReject();
      return;
    }

    this.setState({ isLoading: true });

    try {
      this.state.tokenAccounts.forEach(
        async (account) =>
          await setCustodianNewRefreshToken({
            address: account.address,
            newAuthDetails: {
              refreshToken: connectRequest.token,
              refreshTokenUrl: connectRequest.apiUrl,
            },
          }),
      );

      showInteractiveReplacementTokenBanner({});

      this.removeAddTokenConnectRequest(connectRequest);

      history.push({
        pathname: INSTITUTIONAL_FEATURES_DONE_ROUTE,
        state: {
          imgSrc: custodian?.iconUrl,
          title: this.context.t('custodianReplaceRefreshTokenChangedTitle'),
          description: this.context.t(
            'custodianReplaceRefreshTokenChangedSubtitle',
          ),
        },
      });

      this._isMounted && this.setState({ isLoading: false });
    } catch (e) {
      console.error(e);
    }
  };

  renderAccounts = () => {
    const { tokenAccounts } = this.state;

    const tooltipText = this.state.copied
      ? this.context.t('copiedExclamation')
      : this.context.t('copyToClipboard');

    return (
      <div
        className="interactive-replacement-token-page__accounts"
        data-testid="interactive-replacement-token-page"
      >
        {tokenAccounts.map((account, idx) => {
          return (
            <div
              className="interactive-replacement-token-page__accounts__item"
              key={account.address}
            >
              <div className="interactive-replacement-token-page__accounts__item__body">
                <label
                  htmlFor={`address-${idx}`}
                  className="interactive-replacement-token-page__accounts__item__title"
                >
                  <span
                    data-testid="account-name"
                    className="interactive-replacement-token-page__accounts__item__name"
                  >
                    {account.name}
                  </span>
                </label>
                <label
                  htmlFor={`address-${idx}`}
                  className="interactive-replacement-token-page__accounts__item__subtitle"
                >
                  <span className="interactive-replacement-token-page__accounts__item__address">
                    <a
                      className="interactive-replacement-token-page__accounts__item__address-link"
                      href={`${MAINNET_DEFAULT_BLOCK_EXPLORER_URL}address/${account.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {shortenAddress(account.address)}
                      <OpenInNewTab
                        size={15}
                        color="#037DD6"
                        className="link-icon"
                      />
                    </a>
                    <Tooltip position="bottom" title={tooltipText}>
                      <button
                        className="interactive-replacement-token-page__accounts__item__address-clipboard"
                        onClick={() => {
                          this.setState({ copied: true });
                          this.copyTimeout = setTimeout(
                            () => this.setState({ copied: false }),
                            SECOND * 3,
                          );
                          copy(account.address);
                        }}
                      >
                        <CopyIcon
                          size={12}
                          color="#989a9b"
                          className="copy-icon"
                        />
                      </button>
                    </Tooltip>
                  </span>
                </label>
                <div className="interactive-replacement-token-page__accounts__item-details">
                  {account.labels && (
                    <CustodyLabels
                      labels={account.labels}
                      index={idx.toString()}
                      hideNetwork
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  render() {
    const { history, mostRecentOverviewPage, connectRequests, custodian } =
      this.props;
    const { isLoading, error } = this.state;
    const connectRequest = connectRequests ? connectRequests[0] : undefined;

    if (!connectRequest) {
      history.push(mostRecentOverviewPage);
      return null;
    }

    return (
      <div className="page-container">
        <div className={`page-container__header ${error && 'error'}`}>
          <div className="page-container__title">
            {this.context.t('custodianReplaceRefreshTokenTitle')}{' '}
            {error ? this.context.t('failed').toLowerCase() : ''}
          </div>
          {!error && (
            <div className="page-container__subtitle">
              {this.context.t('custodianReplaceRefreshTokenSubtitle')}
            </div>
          )}
        </div>

        <div className="page-container__content">
          <div className="interactive-replacement-token-page">
            {error ? (
              <div className="interactive-replacement-token-page__accounts__error">
                {this.context.t('custodianReplaceRefreshTokenChangedFailed', [
                  custodian.displayName || 'Custodian',
                ])}
              </div>
            ) : null}
            {this.renderAccounts()}
          </div>
        </div>

        <div className="page-container__footer">
          {isLoading ? (
            <footer>
              <PulseLoader />
            </footer>
          ) : (
            <footer>
              <Button
                type="default"
                large
                className="page-container__footer-button"
                onClick={this.handleReject}
              >
                {this.context.t('reject')}
              </Button>
              <Button
                type="primary"
                large
                className="page-container__footer-button"
                onClick={this.handleApprove}
              >
                {error
                  ? custodian.displayName || 'Custodian'
                  : this.context.t('approveButtonText')}
              </Button>
            </footer>
          )}
        </div>
      </div>
    );
  }
}
