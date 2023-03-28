import React, { useContext, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import Button from '../../../components/ui/button';
import {
  CUSTODY_ACCOUNT_DONE_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
// @TODO Fix import CustodyAccountList is merged
import CustodyAccountList from './account-list';
import JwtUrlForm from '../../../components/institutional/jwt-url-form';

// * const mmiActions = mmiActionsFactory();
// * mmiActions.connectCustodyAddresses(...)

const CustodyView = (props) => {

  const handleSearchDebounce = useCallback(
    debounce((currentJwt, apiUrl, input, selectedCustodianType, chainId) => getCustodianAccountsByAddress(currentJwt, apiUrl, input, selectedCustodianType, chainId), 300),
    []);

  const t = useContext(I18nContext);

  const [selectedAccounts, setSelectedAccounts] = useState({});
  const [selectedCustodianName, setSelectedCustodianName] = useState('');
  const [selectedCustodianImage, setSelectedCustodianImage] = useState(null);
  const [selectedCustodianDisplayName, setSelectedCustodianDisplayName] = useState('');
  const [selectedCustodianType, setSelectedCustodianType] = useState('');
  const [connectError, setConnectError] = useState('');
  const [currentJwt, setCurrentJwt] = useState('');
  const [selectError, setSelectError] = useState('');
  const [jwtList, setJwtList] = useState([]);
  const [apiUrl, setApiUrl] = useState('');
  const [addNewTokenClicked, setAddNewTokenClicked] = useState(false);
  const [chainId, setChainId] = useState(0);
  const [connectRequest, setConnectRequest] = useState(undefined);
  const [accounts, setAccounts] = useState();

    // declare the async data fetching function
    const fetchData = async () => {
      const connectRequest = await props.getCustodianConnectRequest();
      setChainId(parseInt(this.props.provider.chainId, 16));

      // check if it's empty object
      if (Object.keys(connectRequest).length) {
        setConnectRequest(connectRequest);
        setCurrentJwt(connectRequest.token || (await props.getCustodianToken()));
        setSelectedCustodianType(connectRequest.custodianType);
        setSelectedCustodianName(connectRequest.custodianName);
        setApiUrl(connectRequest.apiUrl);
        connect();
      }
    }

  useEffect(() => {
    // call the function
    fetchData()
      // make sure to catch any error
      .catch(console.error);;
  }, [])

  const handleNetworkChange = async () => {
    if (!isNaN(chainId)) {
      const jwt = currentJwt ? currentJwt : jwtList[0];

      if (jwt && jwt.length) {
        setAccounts((await getCustodianAccounts(jwt, apiUrl, selectedCustodianType, true)));
      }
    }
  };

  const connect = () => {
    try {
      // @shane-t I added this because sometimes if you have one JWT already, but no dropdown yet, this.state.currentJwt is null!
      const jwt = currentJwt ? currentJwt : jwtList[0];
      setConnectError('');
      const accounts = await getCustodianAccounts(jwt, apiUrl, selectedCustodianType, true);
      setAccounts(accounts);
      context.current.trackEvent({
        category: 'MMI',
        event: 'Connect to custodian',
        properties: {
          custodian: selectedCustodianName,
          apiUrl: apiUrl,
          rpc: Boolean(connectRequest)
        }
      });
    } catch (e) {
      handleConnectError(e);
    }
  };

  const getCustodianAccounts = async () => {
    const {
      selectedCustodianType
    } = state.current;
    return await props.getCustodianAccounts(token, apiUrl, custody || selectedCustodianType, getNonImportedAccounts);
  };

  const getCustodianAccountsByAddress = async (token, apiUrl, address, custody) => {
    try {
      const accounts = await props.getCustodianAccountsByAddress(token, apiUrl, address, custody);
      setAccounts(accounts);
    } catch (e) {
      handleConnectError(e);
    }
  };

  const onSearchChange = (input) => {
    handleSearchDebounce(currentJwt, apiUrl, input, selectedCustodianType, chainId);
  };

  const handleConnectError = () => {
    let errorMessage;
    const detailedError = e.message.split(':');

    if (detailedError.length > 1 && !isNaN(parseInt(detailedError[0], 10))) {
      if (parseInt(detailedError[0], 10) === 401) {
        // Authentication Error
        errorMessage = 'Authentication error. Please ensure you have entered the correct token';
      }
    } // Connectivity issue, or NXDOMAIN etc


    if (/Network Error/u.test(e.message)) {
      errorMessage = 'Network error. Please ensure you have entered the correct API URL';
    } // Much of the time, there wont be a detail property


    if (!errorMessage) {
      errorMessage = e.message;
    }

    setConnectError(`Something went wrong connecting your custodian account. Error details: ${errorMessage}`);
    context.current.trackEvent({
      category: 'MMI',
      event: 'Connect to custodian error',
      properties: {
        custodian: selectedCustodianName
      }
    });
  };

  const renderHeader = () => {
    return <div className="custody-connect">
        <h4 className="custody-connect__title">
          {context.current.t('selectAnAccount')}
        </h4>
        <p className="custody-connect__msg">
          {context.current.t('selectAnAccountHelp')}
        </p>
      </div>;
  };

  const renderSelectCustody = () => {
    const {
      t
    } = context.current;
    const {
      history
    } = props;
    const custodianButtons = [];
    props.custodians.forEach(custodian => {
      if (!custodian.production && process.env.METAMASK_ENVIRONMENT === 'production' || custodian.hidden || connectRequest && Object.keys(connectRequest).length && custodian.name !== selectedCustodianName) {
        return;
      }

      custodianButtons.push(<li key={uuidv4()} className="custody-connect__list__list-item">
          <span className="custody-connect__list__list-item__avatar">
            {custodian.iconUrl && <img className="custody-connect__list__list-item__img" src={custodian.iconUrl} alt={custodian.displayName} />}
            {custodian.displayName}
          </span>

          <button data-testid="custody-connect-button" className={classNames('custody-connect__list__list-item__button', 'button btn--rounded button btn-primary')} onClick={async _ => {
          const jwtList = await props.getCustodianJWTList(custodian.name);
          setSelectedCustodianName(custodian.name);
          setSelectedCustodianType(custodian.type);
          setSelectedCustodianImage(custodian.iconUrl);
          setSelectedCustodianDisplayName(custodian.displayName);
          setApiUrl(custodian.apiUrl);
          setCurrentJwt(jwtList[0] || '');
          setJwtList(jwtList);
          context.current.trackEvent({
            category: 'MMI',
            event: 'Custodian Selected',
            properties: {
              custodian: custodian.name
            }
          });
        }}>
            {t('connectCustodialSelect')}
          </button>
        </li>);
    });
    return <div className="custody-connect__header">
        <button className="custody-connect__header__back-btn" onClick={() => history.push(DEFAULT_ROUTE)}>
          <i className="fas fa-chevron-left custody-connect__header__back-btn__chevron-left" />
          {t('back')}
        </button>
        <h4 className="custody-connect__header__title">
          {context.current.t('connectCustodialAccountTitle')}
        </h4>
        <p className="custody-connect__header__msg">
          {context.current.t('connectCustodialAccountMsg')}
        </p>
        <div>
          <ul className="custody-connect__list">{custodianButtons}</ul>
        </div>
      </div>;
  };

  const cancelConnectCustodianToken = () => {
    setSelectedCustodianName('');
    setSelectedCustodianType('');
    setSelectedCustodianImage(null);
    setSelectedCustodianDisplayName('');
    setApiUrl('');
    setCurrentJwt('');
    setConnectError('');
    setSelectError('');
  };

  const renderConnectButton = () => {
    const {
      t
    } = context.current;
    const {
      selectedCustodianName,
      addNewTokenClicked,
      currentJwt
    } = state.current;
    return <div className="jwt-url-form-buttons">
        <Button className="custody-connect__cancel-btn" onClick={() => {
        cancelConnectCustodianToken();
      }}>
          {t('cancel')}
        </Button>
        <Button type="primary" data-testid="jwt-form-connect-button" className="custody-connect__connect-btn" onClick={connect} disabled={!selectedCustodianName || addNewTokenClicked && !currentJwt}>
          {context.current.t('connect')}
        </Button>
      </div>;
  };

  const selectAllAccounts = () => {
    const {
      accounts
    } = state.current;
    const allAccounts = {};

    if (e.currentTarget.checked) {
      accounts.forEach(account => {
        allAccounts[account.address] = {
          name: account.name,
          custodianDetails: account.custodianDetails,
          labels: account.labels,
          token: currentJwt,
          apiUrl: apiUrl,
          chainId: account.chainId,
          custodyType: selectedCustodianType,
          custodyName: selectedCustodianName
        };
      });
      setSelectedAccounts(allAccounts);
    } else {
      setSelectedAccounts({});
    }
  };

  const renderSelectAll = () => {
    return <div className="custody-select-all">
        <input type="checkbox" id="selectAllAccounts" name="selectAllAccounts" className="custody-select-all__input" value={{}} onChange={e => selectAllAccounts(e)} checked={Object.keys(selectedAccounts).length === accounts.length} />
        <label htmlFor="selectAllAccounts">
          {context.current.t('selectAllAccounts')}
        </label>
      </div>;
  };

  const renderSelectList = () => {
    const {
      history,
      connectCustodyAddresses,
      provider
    } = props;
    return <CustodyAccountList custody={selectedCustodianName} accounts={accounts} onAccountChange={account => {
      const {
        selectedAccounts
      } = state.current;

      if (selectedAccounts[account.address]) {
        delete selectedAccounts[account.address];
      } else {
        selectedAccounts[account.address] = {
          name: account.name,
          custodianDetails: account.custodianDetails,
          labels: account.labels,
          token: currentJwt,
          apiUrl: apiUrl,
          chainId: account.chainId,
          custodyType: selectedCustodianType,
          custodyName: selectedCustodianName
        };
      }

      setSelectedAccounts(selectedAccounts);
    }} provider={provider} selectedAccounts={selectedAccounts} onAddAccounts={async () => {
      try {
        await connectCustodyAddresses(selectedCustodianType, selectedCustodianName, selectedAccounts);
        const selectedCustodian = props.custodians.find(custodian => custodian.name === selectedCustodianName);
        history.push({
          pathname: CUSTODY_ACCOUNT_DONE_ROUTE,
          state: {
            imgSrc: selectedCustodian.iconUrl,
            title: context.current.t('custodianAccountAddedTitle'),
            description: context.current.t('custodianAccountAddedDesc')
          }
        });
        context.current.trackEvent({
          category: 'MMI',
          event: 'Custodial accounts connected',
          properties: {
            custodian: selectedCustodianName,
            numberOfAccounts: Object.keys(selectedAccounts).length,
            chainId: chainId
          }
        });
      } catch (e) {
        setSelectError(e.message);
      }
    }} onSearchChange={input => onSearchChange(input)} onCancel={() => {
      setAccounts(null);
      setSelectedCustodianName(null);
      setSelectedCustodianType(null);
      setSelectedAccounts({});
      setCurrentJwt('');
      setApiUrl('');
      setAddNewTokenClicked(false);

      if (Object.keys(connectRequest).length) {
        history.push(DEFAULT_ROUTE);
      }

      context.current.trackEvent({
        category: 'MMI',
        event: 'Connect to custodian cancel',
        properties: {
          custodian: selectedCustodianName,
          numberOfAccounts: Object.keys(selectedAccounts).length,
          chainId: chainId
        }
      });
    }} />;
  };

  const renderCustodyContent = () => {
    const {
      t
    } = context.current;

    if (!accounts && !selectedCustodianType) {
      return renderSelectCustody();
    }

    if (!accounts && selectedCustodianType) {
      return <>
          <div className="custody-connect__header">
            <button className="custody-connect__header__back-btn" onClick={() => cancelConnectCustodianToken()}>
              <i className="fas fa-chevron-left custody-connect__header__back-btn__chevron-left" />
              {t('back')}
            </button>
            <h4 className="custody-connect__header__title">
              <span className="custody-connect__list__list-item__avatar">
                {selectedCustodianImage && <img className="custody-connect__list__list-item__img" src={selectedCustodianImage} alt={selectedCustodianDisplayName} />}
                {selectedCustodianDisplayName}
              </span>
            </h4>
            <p className="custody-connect__header__msg">
              {context.current.t('enterCustodianToken', [selectedCustodianDisplayName])}
            </p>
          </div>
          <div className="custody-connect__jwt-form">
            <JwtUrlForm jwtList={jwtList} currentJwt={currentJwt} onJwtChange={jwt => {}} jwtInputText={context.current.t('pasteJWTToken')} apiUrl={apiUrl} urlInputText={context.current.t('custodyApiUrl', [selectedCustodianDisplayName])} onUrlChange={url => {}} />
            {renderConnectButton()}
          </div>
        </>;
    }

    if (accounts.length > 0) {
      return <>
          {renderHeader()}
          {renderSelectAll()}
          {renderSelectList()}
        </>;
    }

    return null;
  };

  const renderAllAccountsConnected = () => {
    const {
      history
    } = props;
    const {
      t
    } = context.current;

    if (accounts && accounts.length === 0) {
      return <div data-testid="custody-accounts-empty" className="custody-accounts-empty">
          <p className="custody-accounts-empty__title">
            {t('allCustodianAccountsConnectedTitle')}
          </p>
          <p className="custody-accounts-empty__subtitle">
            {t('allCustodianAccountsConnectedSubtitle')}
          </p>

          <footer className="custody-accounts-empty__footer">
            <Button type="primary" large onClick={() => history.push(DEFAULT_ROUTE)}>
              {t('close')}
            </Button>
          </footer>
        </div>;
    }

    return null;
  };

  return <div className="new-account-custody-form">
        {connectError && <p className="error">{connectError}</p>}

        {selectError && <p className="error">{selectError}</p>}

        {renderCustodyContent()}

        {renderAllAccountsConnected()}
      </div>;
};

CustodyView.propTypes = {
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

export default connect(mapStateToProps, mapDispatchToProps)(CustodyView);
