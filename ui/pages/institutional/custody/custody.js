import React, { useContext, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { Text, Icon, ICON_NAMES, ICON_SIZES } from '../../../components/component-library';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  TypographyVariant,
  JustifyContent,
  BorderRadius,
  BackgroundColor,
  TextColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import Button from '../../../components/ui/button';
import Box from '../../../components/ui/box';
import {
  CUSTODY_ACCOUNT_DONE_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getCurrentChainId,
  getProvider,
  getMmiConfiguration,
} from '../../../selectors';
// @TODO Fix import CustodyAccountList is merged
import CustodyAccountList from './account-list';
import JwtUrlForm from '../../../components/institutional/jwt-url-form';

const CustodyView = () => {
  const t = useContext(I18nContext);
  const history = useHistory();

const mmiActions = mmiActionsFactory();
  const currentChainId = useSelector(getCurrentChainId)
  const provider = useSelector(getProvider);
  const custodians = useSelector(getMmiConfiguration);

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

  const handleSearchDebounce = useCallback(
    debounce((currentJwt, apiUrl, input, selectedCustodianType, chainId) => getCustodianAccountsByAddress(currentJwt, apiUrl, input, selectedCustodianType, chainId), 300),
    []);

  const fetchConnectRequest = async () => {
    const connectRequest = await mmiActions.getCustodianConnectRequest();
    setChainId(parseInt(currentChainId, 16));

    // check if it's empty object
    if (Object.keys(connectRequest).length) {
      setConnectRequest(connectRequest);
      setCurrentJwt(connectRequest.token || (await mmiActions.getCustodianToken()));
      setSelectedCustodianType(connectRequest.custodianType);
      setSelectedCustodianName(connectRequest.custodianName);
      setApiUrl(connectRequest.apiUrl);
      connect();
    }
  }

  useEffect(() => {
    // call the function
    fetchConnectRequest()
      // make sure to catch any error
      .catch(console.error);;
  }, [])

  useEffect(() => {
    if (parseInt(chainId, 16) !== chainId) {
      setChainId(parseInt(currentChainId, 16));
      handleNetworkChange();
    }
  }, [currentChainId]);

  const handleNetworkChange = async () => {
    if (!isNaN(chainId)) {
      const jwt = currentJwt ? currentJwt : jwtList[0];

      if (jwt && jwt.length) {
        setAccounts((await getCustodianAccounts(jwt, apiUrl, selectedCustodianType, true)));
      }
    }
  };

  const connect = async () => {
    try {
      // If you have one JWT already, but no dropdown yet, currentJwt is null!
      const jwt = currentJwt ? currentJwt : jwtList[0];
      setConnectError('');
      const accounts = await getCustodianAccounts(jwt, apiUrl, selectedCustodianType, true);
      setAccounts(accounts);
      trackEvent({
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
    return await mmiActions.getCustodianAccounts(token, apiUrl, custody || selectedCustodianType, getNonImportedAccounts);
  };

  const getCustodianAccountsByAddress = async (token, apiUrl, address, custody) => {
    try {
      const accounts = await mmiActions.getCustodianAccountsByAddress(token, apiUrl, address, custody);
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
    }

    if (/Network Error/u.test(e.message)) {
      errorMessage = 'Network error. Please ensure you have entered the correct API URL';
    }

    if (!errorMessage) {
      errorMessage = e.message;
    }

    setConnectError(`Something went wrong connecting your custodian account. Error details: ${errorMessage}`);
    trackEvent({
      category: 'MMI',
      event: 'Connect to custodian error',
      properties: {
        custodian: selectedCustodianName
      }
    });
  };

  const renderHeader = () => {
    return <Box className="custody-connect">
        <Text as="h4" className="custody-connect__title">
          {t('selectAnAccount')}
        </Text>
        <p className="custody-connect__msg">
          {t('selectAnAccountHelp')}
        </p>
      </Box>;
  };

  const renderSelectCustody = () => {
    const custodianButtons = [];
    custodians.forEach(custodian => {
      if (!custodian.production && process.env.METAMASK_ENVIRONMENT === 'production' || custodian.hidden || connectRequest && Object.keys(connectRequest).length && custodian.name !== selectedCustodianName) {
        return;
      }

      custodianButtons.push(<li key={uuidv4()} className="custody-connect__list__list-item">
          <span className="custody-connect__list__list-item__avatar">
            {custodian.iconUrl && <img className="custody-connect__list__list-item__img" src={custodian.iconUrl} alt={custodian.displayName} />}
            {custodian.displayName}
          </span>

          <button data-testid="custody-connect-button" className={classNames('custody-connect__list__list-item__button', 'button btn--rounded button btn-primary')} onClick={async _ => {
          const jwtList = await mmiActions.getCustodianJWTList(custodian.name);
          setSelectedCustodianName(custodian.name);
          setSelectedCustodianType(custodian.type);
          setSelectedCustodianImage(custodian.iconUrl);
          setSelectedCustodianDisplayName(custodian.displayName);
          setApiUrl(custodian.apiUrl);
          setCurrentJwt(jwtList[0] || '');
          setJwtList(jwtList);
          trackEvent({
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
        <Text as="h4" className="custody-connect__header__title">
          {t('connectCustodialAccountTitle')}
        </Text>
        <p className="custody-connect__header__msg">
          {t('connectCustodialAccountMsg')}
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
    return <div className="jwt-url-form-buttons">
        <Button className="custody-connect__cancel-btn" onClick={() => {
        cancelConnectCustodianToken();
      }}>
          {t('cancel')}
        </Button>
        <Button type="primary" data-testid="jwt-form-connect-button" className="custody-connect__connect-btn" onClick={connect} disabled={!selectedCustodianName || addNewTokenClicked && !currentJwt}>
          {t('connect')}
        </Button>
      </div>;
  };

  const selectAllAccounts = () => {
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
          {t('selectAllAccounts')}
        </label>
      </div>;
  };

  const renderSelectList = () => {
    return <CustodyAccountList custody={selectedCustodianName} accounts={accounts} onAccountChange={account => {

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
        await mmiActions.connectCustodyAddresses(selectedCustodianType, selectedCustodianName, selectedAccounts);
        const selectedCustodian = custodians.find(custodian => custodian.name === selectedCustodianName);
        history.push({
          pathname: CUSTODY_ACCOUNT_DONE_ROUTE,
          state: {
            imgSrc: selectedCustodian.iconUrl,
            title: t('custodianAccountAddedTitle'),
            description: t('custodianAccountAddedDesc')
          }
        });
        trackEvent({
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

      trackEvent({
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
    if (!accounts && !selectedCustodianType) {
      return renderSelectCustody();
    }

    if (!accounts && selectedCustodianType) {
      return <>
          <div className="custody-connect__header">
            <button className="custody-connect__header__back-btn" onClick={() => cancelConnectCustodianToken()}>
            <Icon name={ICON_NAMES.ARROW_LEFT} size={ICON_SIZES.SM} color={IconColor.iconAlternative} />
              {t('back')}
            </button>
            <Text as="h4" className="custody-connect__header__title">
              <span className="custody-connect__list__list-item__avatar">
                {selectedCustodianImage && <img className="custody-connect__list__list-item__img" src={selectedCustodianImage} alt={selectedCustodianDisplayName} />}
                {selectedCustodianDisplayName}
              </span>
            </Text>
            <Text className="custody-connect__header__msg">
              {t('enterCustodianToken', [selectedCustodianDisplayName])}
            </Text>
          </div>
          <div className="custody-connect__jwt-form">
            <JwtUrlForm jwtList={jwtList} currentJwt={currentJwt} onJwtChange={jwt => {}} jwtInputText={t('pasteJWTToken')} apiUrl={apiUrl} urlInputText={t('custodyApiUrl', [selectedCustodianDisplayName])} onUrlChange={url => {}} />
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

export default CustodyView;
