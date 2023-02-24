import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { getMMIActions } from '../../../store/actions';
import Button from '../../../components/ui/button';
import {
  CUSTODY_ACCOUNT_DONE_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import CustodyAccountList from './account-list';
import JwtUrlForm from './jwt-url-form/jwt-url-form.component';

class CustodySubview extends Component {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  state = {
    selectedAccounts: {},
    selectedCustodianName: '',
    selectedCustodianImage: null,
    selectedCustodianDisplayName: '',
    selectedCustodianType: '',
    connectError: '',
    currentJwt: '',
    selectError: '',
    jwtList: [],
    apiUrl: '',
    addNewTokenClicked: false,
    chainId: 0,
    connectRequest: undefined,
  };

  constructor(props) {
    super(props);
    this.getCustodianAccountsByAddress = debounce(
      this.getCustodianAccountsByAddress,
      300,
    );
  }

  async componentDidMount() {
    const connectRequest = await this.props.getCustodianConnectRequest();
    this.setState({ chainId: parseInt(this.props.provider.chainId, 16) });
    // check if it's empty object

    if (Object.keys(connectRequest).length) {
      this.setState({
        connectRequest,
        currentJwt:
          connectRequest.token || (await this.props.getCustodianToken()),
        selectedCustodianType: connectRequest.custodianType,
        selectedCustodianName: connectRequest.custodianName,
        apiUrl: connectRequest.apiUrl, // By default, use URL from request, otherwise use defaul custodian URL
      });
      this.connect();
    }
  }

  // @shane-t TODO: are we still allowed to do this?
  // I tried this.props.provider.subscribe but no luck

  componentDidUpdate(prevProps) {
    if (prevProps.provider.chainId !== this.props.provider.chainId) {
      this.setState(
        { chainId: parseInt(this.props.provider.chainId, 16) },
        this.handleNetworkChange.bind(this),
      );
    }
  }

  async handleNetworkChange() {
    if (!isNaN(this.state.chainId)) {
      const jwt = this.state.currentJwt
        ? this.state.currentJwt
        : this.state.jwtList[0];

      if (jwt && jwt.length) {
        this.setState({
          accounts: await this.getCustodianAccounts(
            jwt,
            this.state.apiUrl,
            this.state.selectedCustodianType,
            true,
          ),
        });
      }
    }
  }

  connect = async () => {
    try {
      // @shane-t I added this because sometimes if you have one JWT already, but no dropdown yet, this.state.currentJwt is null!
      const jwt = this.state.currentJwt
        ? this.state.currentJwt
        : this.state.jwtList[0];

      this.setState({ connectError: '' });
      const accounts = await this.getCustodianAccounts(
        jwt,
        this.state.apiUrl,
        this.state.selectedCustodianType,
        true,
      );
      this.setState({ accounts });

      this.context.trackEvent({
        category: 'MMI',
        event: 'Connect to custodian',
        properties: {
          custodian: this.state.selectedCustodianName,
          apiUrl: this.state.apiUrl,
          rpc: Boolean(this.state.connectRequest),
        },
      });
    } catch (e) {
      this.handleConnectError(e);
    }
  };

  async getCustodianAccounts(token, apiUrl, custody, getNonImportedAccounts) {
    const { selectedCustodianType } = this.state;
    return await this.props.getCustodianAccounts(
      token,
      apiUrl,
      custody || selectedCustodianType,
      getNonImportedAccounts,
    );
  }

  async getCustodianAccountsByAddress(token, apiUrl, address, custody) {
    try {
      const accounts = await this.props.getCustodianAccountsByAddress(
        token,
        apiUrl,
        address,
        custody,
      );
      this.setState({ accounts });
    } catch (e) {
      this.handleConnectError(e);
    }
  }

  onSearchChange(input) {
    this.getCustodianAccountsByAddress(
      this.state.currentJwt,
      this.state.apiUrl,
      input,
      this.state.selectedCustodianType,
      this.state.chainId,
    );
  }

  handleConnectError(e) {
    let errorMessage;

    const detailedError = e.message.split(':');
    if (detailedError.length > 1 && !isNaN(parseInt(detailedError[0], 10))) {
      if (parseInt(detailedError[0], 10) === 401) {
        // Authentication Error
        errorMessage =
          'Authentication error. Please ensure you have entered the correct token';
      }
    }

    // Connectivity issue, or NXDOMAIN etc
    if (/Network Error/u.test(e.message)) {
      errorMessage =
        'Network error. Please ensure you have entered the correct API URL';
    }

    // Much of the time, there wont be a detail property

    if (!errorMessage) {
      errorMessage = e.message;
    }

    this.setState({
      connectError: `Something went wrong connecting your custodian account. Error details: ${errorMessage}`,
    });

    this.context.trackEvent({
      category: 'MMI',
      event: 'Connect to custodian error',
      properties: {
        custodian: this.state.selectedCustodianName,
      },
    });
  }

  renderHeader() {
    return (
      <div className="custody-connect">
        <h4 className="custody-connect__title">
          {this.context.t('selectAnAccount')}
        </h4>
        <p className="custody-connect__msg">
          {this.context.t('selectAnAccountHelp')}
        </p>
      </div>
    );
  }

  renderSelectCustody() {
    const { t } = this.context;
    const { history } = this.props;
    const custodianButtons = [];

    this.props.custodians.forEach((custodian) => {
      if (
        (!custodian.production &&
          process.env.METAMASK_ENVIRONMENT === 'production') ||
        custodian.hidden ||
        (this.state.connectRequest &&
          Object.keys(this.state.connectRequest).length &&
          custodian.name !== this.state.selectedCustodianName)
      ) {
        return;
      }

      custodianButtons.push(
        <li key={uuidv4()} className="custody-connect__list__list-item">
          <span className="custody-connect__list__list-item__avatar">
            {custodian.iconUrl && (
              <img
                className="custody-connect__list__list-item__img"
                src={custodian.iconUrl}
                alt={custodian.displayName}
              />
            )}
            {custodian.displayName}
          </span>

          <button
            data-testid="custody-connect-button"
            className={classNames(
              'custody-connect__list__list-item__button',
              'button btn--rounded button btn-primary',
            )}
            onClick={async (_) => {
              const jwtList = await this.props.getCustodianJWTList(
                custodian.name,
              );

              this.setState({
                selectedCustodianName: custodian.name,
                selectedCustodianType: custodian.type,
                selectedCustodianImage: custodian.iconUrl,
                selectedCustodianDisplayName: custodian.displayName,
                apiUrl: custodian.apiUrl,
                currentJwt: jwtList[0] || '',
                jwtList,
              });
              this.context.trackEvent({
                category: 'MMI',
                event: 'Custodian Selected',
                properties: {
                  custodian: custodian.name,
                },
              });
            }}
          >
            {t('connectCustodialSelect')}
          </button>
        </li>,
      );
    });

    return (
      <div className="custody-connect__header">
        <button
          className="custody-connect__header__back-btn"
          onClick={() => history.push(DEFAULT_ROUTE)}
        >
          <i className="fas fa-chevron-left custody-connect__header__back-btn__chevron-left" />
          {t('back')}
        </button>
        <h4 className="custody-connect__header__title">
          {this.context.t('connectCustodialAccountTitle')}
        </h4>
        <p className="custody-connect__header__msg">
          {this.context.t('connectCustodialAccountMsg')}
        </p>
        <div>
          <ul className="custody-connect__list">{custodianButtons}</ul>
        </div>
      </div>
    );
  }

  cancelConnectCustodianToken() {
    this.setState({
      selectedCustodianName: '',
      selectedCustodianType: '',
      selectedCustodianImage: null,
      selectedCustodianDisplayName: '',
      apiUrl: '',
      currentJwt: '',
      connectError: '',
      selectError: '',
    });
  }

  renderConnectButton() {
    const { t } = this.context;

    const { selectedCustodianName, addNewTokenClicked, currentJwt } =
      this.state;
    return (
      <div className="jwt-url-form-buttons">
        <Button
          className="custody-connect__cancel-btn"
          onClick={() => {
            this.cancelConnectCustodianToken();
          }}
        >
          {t('cancel')}
        </Button>
        <Button
          type="primary"
          data-testid="jwt-form-connect-button"
          className="custody-connect__connect-btn"
          onClick={this.connect}
          disabled={
            !selectedCustodianName || (addNewTokenClicked && !currentJwt)
          }
        >
          {this.context.t('connect')}
        </Button>
      </div>
    );
  }

  selectAllAccounts(e) {
    const { accounts } = this.state;
    const allAccounts = {};

    if (e.currentTarget.checked) {
      accounts.forEach((account) => {
        allAccounts[account.address] = {
          name: account.name,
          custodianDetails: account.custodianDetails,
          labels: account.labels,
          token: this.state.currentJwt,
          apiUrl: this.state.apiUrl,
          chainId: account.chainId,
          custodyType: this.state.selectedCustodianType,
          custodyName: this.state.selectedCustodianName,
        };
      });
      this.setState({ selectedAccounts: allAccounts });
    } else {
      this.setState({ selectedAccounts: {} });
    }
  }

  renderSelectAll() {
    return (
      <div className="custody-select-all">
        <input
          type="checkbox"
          id="selectAllAccounts"
          name="selectAllAccounts"
          className="custody-select-all__input"
          value={{}}
          onChange={(e) => this.selectAllAccounts(e)}
          checked={
            Object.keys(this.state.selectedAccounts).length ===
            this.state.accounts.length
          }
        />
        <label htmlFor="selectAllAccounts">
          {this.context.t('selectAllAccounts')}
        </label>
      </div>
    );
  }

  renderSelectList() {
    const { history, connectCustodyAddresses, provider } = this.props;

    return (
      <CustodyAccountList
        custody={this.state.selectedCustodianName}
        accounts={this.state.accounts}
        onAccountChange={(account) => {
          const { selectedAccounts } = this.state;
          if (selectedAccounts[account.address]) {
            delete selectedAccounts[account.address];
          } else {
            selectedAccounts[account.address] = {
              name: account.name,
              custodianDetails: account.custodianDetails,
              labels: account.labels,
              token: this.state.currentJwt,
              apiUrl: this.state.apiUrl,
              chainId: account.chainId,
              custodyType: this.state.selectedCustodianType,
              custodyName: this.state.selectedCustodianName,
            };
          }
          this.setState({ selectedAccounts });
        }}
        provider={provider}
        selectedAccounts={this.state.selectedAccounts}
        onAddAccounts={async () => {
          try {
            await connectCustodyAddresses(
              this.state.selectedCustodianType,
              this.state.selectedCustodianName,
              this.state.selectedAccounts,
            );

            const selectedCustodian = this.props.custodians.find(
              (custodian) =>
                custodian.name === this.state.selectedCustodianName,
            );

            history.push({
              pathname: CUSTODY_ACCOUNT_DONE_ROUTE,
              state: {
                imgSrc: selectedCustodian.iconUrl,
                title: this.context.t('custodianAccountAddedTitle'),
                description: this.context.t('custodianAccountAddedDesc'),
              },
            });

            this.context.trackEvent({
              category: 'MMI',
              event: 'Custodial accounts connected',
              properties: {
                custodian: this.state.selectedCustodianName,
                numberOfAccounts: Object.keys(this.state.selectedAccounts)
                  .length,
                chainId: this.state.chainId,
              },
            });
          } catch (e) {
            this.setState({ selectError: e.message });
          }
        }}
        onSearchChange={(input) => this.onSearchChange(input)}
        onCancel={() => {
          this.setState({
            accounts: null,
            selectedCustodianName: null,
            selectedCustodianType: null,
            selectedAccounts: {},
            currentJwt: '',
            apiUrl: '',
            addNewTokenClicked: false,
          });
          if (Object.keys(this.state.connectRequest).length) {
            history.push(DEFAULT_ROUTE);
          }

          this.context.trackEvent({
            category: 'MMI',
            event: 'Connect to custodian cancel',
            properties: {
              custodian: this.state.selectedCustodianName,
              numberOfAccounts: Object.keys(this.state.selectedAccounts).length,
              chainId: this.state.chainId,
            },
          });
        }}
      />
    );
  }

  renderCustodyContent() {
    const { t } = this.context;

    if (!this.state.accounts && !this.state.selectedCustodianType) {
      return this.renderSelectCustody();
    }

    if (!this.state.accounts && this.state.selectedCustodianType) {
      return (
        <>
          <div className="custody-connect__header">
            <button
              className="custody-connect__header__back-btn"
              onClick={() => this.cancelConnectCustodianToken()}
            >
              <i className="fas fa-chevron-left custody-connect__header__back-btn__chevron-left" />
              {t('back')}
            </button>
            <h4 className="custody-connect__header__title">
              <span className="custody-connect__list__list-item__avatar">
                {this.state.selectedCustodianImage && (
                  <img
                    className="custody-connect__list__list-item__img"
                    src={this.state.selectedCustodianImage}
                    alt={this.state.selectedCustodianDisplayName}
                  />
                )}
                {this.state.selectedCustodianDisplayName}
              </span>
            </h4>
            <p className="custody-connect__header__msg">
              {this.context.t('enterCustodianToken', [
                this.state.selectedCustodianDisplayName,
              ])}
            </p>
          </div>
          <div className="custody-connect__jwt-form">
            <JwtUrlForm
              jwtList={this.state.jwtList}
              currentJwt={this.state.currentJwt}
              onJwtChange={(jwt) => this.setState({ currentJwt: jwt })}
              jwtInputText={this.context.t('pasteJWTToken')}
              apiUrl={this.state.apiUrl}
              urlInputText={this.context.t('custodyApiUrl', [
                this.state.selectedCustodianDisplayName,
              ])}
              onUrlChange={(url) => this.setState({ apiUrl: url })}
            />
            {this.renderConnectButton()}
          </div>
        </>
      );
    }

    if (this.state.accounts.length > 0) {
      return (
        <>
          {this.renderHeader()}
          {this.renderSelectAll()}
          {this.renderSelectList()}
        </>
      );
    }

    return null;
  }

  renderAllAccountsConnected() {
    const { history } = this.props;
    const { t } = this.context;

    if (this.state.accounts && this.state.accounts.length === 0) {
      return (
        <div
          data-testid="custody-accounts-empty"
          className="custody-accounts-empty"
        >
          <p className="custody-accounts-empty__title">
            {t('allCustodianAccountsConnectedTitle')}
          </p>
          <p className="custody-accounts-empty__subtitle">
            {t('allCustodianAccountsConnectedSubtitle')}
          </p>

          <footer className="custody-accounts-empty__footer">
            <Button
              type="primary"
              large
              onClick={() => history.push(DEFAULT_ROUTE)}
            >
              {t('close')}
            </Button>
          </footer>
        </div>
      );
    }

    return null;
  }

  render() {
    return (
      <div className="new-account-custody-form">
        {this.state.connectError && (
          <p className="error">{this.state.connectError}</p>
        )}

        {this.state.selectError && (
          <p className="error">{this.state.selectError}</p>
        )}

        {this.renderCustodyContent()}

        {this.renderAllAccountsConnected()}
      </div>
    );
  }
}

CustodySubview.propTypes = {
  connectCustodyAddresses: PropTypes.func,
  getCustodianAccounts: PropTypes.func,
  getCustodianAccountsByAddress: PropTypes.func,
  getCustodianToken: PropTypes.func,
  getCustodianJWTList: PropTypes.func,
  provider: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  custodians: PropTypes.array,
  history: PropTypes.object,
  getCustodianConnectRequest: PropTypes.func,
};

const mapStateToProps = (state) => {
  const {
    metamask: {
      provider,
      mmiConfiguration: { custodians },
    },
  } = state;
  return {
    provider,
    custodians,
  };
};

/* istanbul ignore next */
const mapDispatchToProps = (dispatch) => {
  const MMIActions = getMMIActions();
  return {
    connectCustodyAddresses: (custodianType, custodianName, accounts) => {
      return dispatch(
        MMIActions.connectCustodyAddresses(
          custodianType,
          custodianName,
          accounts,
        ),
      );
    },
    getCustodianAccounts: (token, apiUrl, custody, getNonImportedAccounts) => {
      return dispatch(
        MMIActions.getCustodianAccounts(
          token,
          apiUrl,
          custody,
          getNonImportedAccounts,
        ),
      );
    },
    getCustodianAccountsByAddress: (token, apiUrl, address, custody) => {
      return dispatch(
        MMIActions.getCustodianAccountsByAddress(
          token,
          apiUrl,
          address,
          custody,
        ),
      );
    },
    getCustodianToken: () => {
      return dispatch(MMIActions.getCustodianToken());
    },
    getCustodianJWTList: (custody) => {
      return dispatch(MMIActions.getCustodianJWTList(custody));
    },
    getCustodianConnectRequest: () =>
      dispatch(MMIActions.getCustodianConnectRequest()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CustodySubview);
