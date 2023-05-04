import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useContext,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  ButtonIcon,
  Button,
  Text,
  Label,
  IconName,
  IconSize,
  BUTTON_SIZES,
  BUTTON_VARIANT,
} from '../../../components/component-library';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  Color,
  JustifyContent,
  BorderRadius,
  BorderColor,
  BLOCK_SIZES,
  TextColor,
  TEXT_ALIGN,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Box from '../../../components/ui/box';
import {
  CUSTODY_ACCOUNT_DONE_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import { getCurrentChainId } from '../../../selectors';
import { getMMIConfiguration } from '../../../selectors/institutional/selectors';
import CustodyAccountList from '../connect-custody/account-list';
import JwtUrlForm from '../../../components/institutional/jwt-url-form';

const CustodyPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();

  const mmiActions = mmiActionsFactory();
  const currentChainId = useSelector(getCurrentChainId);
  const { custodians } = useSelector(getMMIConfiguration);

  const [selectedAccounts, setSelectedAccounts] = useState({});
  const [selectedCustodianName, setSelectedCustodianName] = useState('');
  const [selectedCustodianImage, setSelectedCustodianImage] = useState(null);
  const [selectedCustodianDisplayName, setSelectedCustodianDisplayName] =
    useState('');
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

  const custodianButtons = useMemo(() => {
    const custodianItems = [];
    custodians.forEach((custodian) => {
      if (
        (!custodian.production &&
          process.env.METAMASK_ENVIRONMENT === 'production') ||
        custodian.hidden ||
        (connectRequest &&
          Object.keys(connectRequest).length &&
          custodian.name !== selectedCustodianName)
      ) {
        return;
      }

      custodianItems.push(
        <Box
          key={uuidv4()}
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.ROW}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
          borderColor={BorderColor.borderDefault}
          borderRadius={BorderRadius.SM}
          padding={[3, 4]}
          marginBottom={4}
        >
          <Box display={DISPLAY.FLEX} alignItems={AlignItems.center}>
            {custodian.iconUrl && (
              <img
                width={32}
                height={32}
                src={custodian.iconUrl}
                alt={custodian.displayName}
              />
            )}
            <Text marginLeft={2}>{custodian.displayName}</Text>
          </Box>

          <Button
            size={BUTTON_SIZES.SM}
            data-testid="custody-connect-button"
            onClick={async (_) => {
              const jwtListValue = await dispatch(
                mmiActions.getCustodianJWTList(custodian.name),
              );
              setSelectedCustodianName(custodian.name);
              setSelectedCustodianType(custodian.type);
              setSelectedCustodianImage(custodian.iconUrl);
              setSelectedCustodianDisplayName(custodian.displayName);
              setApiUrl(custodian.apiUrl);
              setCurrentJwt(jwtListValue[0] || '');
              setJwtList(jwtListValue);
              trackEvent({
                category: 'MMI',
                event: 'Custodian Selected',
                properties: {
                  custodian: custodian.name,
                },
              });
            }}
          >
            {t('select')}
          </Button>
        </Box>,
      );
    });

    return custodianItems;
  }, [connectRequest, custodians, dispatch, selectedCustodianName]);

  const handleConnectError = useCallback(
    (e) => {
      let errorMessage;
      const detailedError = e.message.split(':');

      if (detailedError.length > 1 && !isNaN(parseInt(detailedError[0], 10))) {
        if (parseInt(detailedError[0], 10) === 401) {
          // Authentication Error
          errorMessage =
            'Authentication error. Please ensure you have entered the correct token';
        }
      }

      if (/Network Error/u.test(e.message)) {
        errorMessage =
          'Network error. Please ensure you have entered the correct API URL';
      }

      if (!errorMessage) {
        errorMessage = e.message;
      }

      setConnectError(
        `Something went wrong connecting your custodian account. Error details: ${errorMessage}`,
      );
      trackEvent({
        category: 'MMI',
        event: 'Connect to custodian error',
        properties: {
          custodian: selectedCustodianName,
        },
      });
    },
    [selectedCustodianName, trackEvent],
  );

  const getCustodianAccounts = useCallback(
    async (token, custody, getNonImportedAccounts) => {
      return await dispatch(
        mmiActions.getCustodianAccounts(
          token,
          apiUrl,
          custody || selectedCustodianType,
          getNonImportedAccounts,
        ),
      );
    },
    [dispatch, mmiActions, apiUrl, selectedCustodianType],
  );

  const connect = useCallback(async () => {
    try {
      // If you have one JWT already, but no dropdown yet, currentJwt is null!
      const jwt = currentJwt || jwtList[0];
      setConnectError('');
      const accountsValue = await getCustodianAccounts(
        jwt,
        apiUrl,
        selectedCustodianType,
        true,
      );
      setAccounts(accountsValue);
      trackEvent({
        category: 'MMI',
        event: 'Connect to custodian',
        properties: {
          custodian: selectedCustodianName,
          apiUrl,
          rpc: Boolean(connectRequest),
        },
      });
    } catch (e) {
      handleConnectError(e);
    }
  }, [
    apiUrl,
    connectRequest,
    currentJwt,
    getCustodianAccounts,
    handleConnectError,
    jwtList,
    selectedCustodianName,
    selectedCustodianType,
    trackEvent,
  ]);

  useEffect(() => {
    const fetchConnectRequest = async () => {
      const connectRequestValue = await dispatch(
        mmiActions.getCustodianConnectRequest(),
      );
      setChainId(parseInt(currentChainId, 16));

      // check if it's empty object
      if (Object.keys(connectRequestValue).length) {
        setConnectRequest(connectRequestValue);
        setCurrentJwt(
          connectRequestValue.token ||
            (await dispatch(mmiActions.getCustodianToken())),
        );
        setSelectedCustodianType(connectRequestValue.custodianType);
        setSelectedCustodianName(connectRequestValue.custodianName);
        setApiUrl(connectRequestValue.apiUrl);
        connect();
      }
    };

    // call the function
    fetchConnectRequest()
      // make sure to catch any error
      .catch(console.error);
  }, [dispatch, connect, currentChainId, mmiActions]);

  useEffect(() => {
    const handleNetworkChange = async () => {
      if (!isNaN(chainId)) {
        const jwt = currentJwt || jwtList[0];

        if (jwt && jwt.length) {
          setAccounts(
            await getCustodianAccounts(
              jwt,
              apiUrl,
              selectedCustodianType,
              true,
            ),
          );
        }
      }
    };

    if (parseInt(chainId, 16) !== chainId) {
      setChainId(parseInt(currentChainId, 16));
      handleNetworkChange();
    }
  }, [
    getCustodianAccounts,
    apiUrl,
    currentJwt,
    jwtList,
    selectedCustodianType,
    currentChainId,
    chainId,
  ]);

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

  const setSelectAllAccounts = (e) => {
    const allAccounts = {};

    if (e.currentTarget.checked) {
      accounts.forEach((account) => {
        allAccounts[account.address] = {
          name: account.name,
          custodianDetails: account.custodianDetails,
          labels: account.labels,
          token: currentJwt,
          apiUrl,
          chainId: account.chainId,
          custodyType: selectedCustodianType,
          custodyName: selectedCustodianName,
        };
      });
      setSelectedAccounts(allAccounts);
    } else {
      setSelectedAccounts({});
    }
  };

  return (
    <Box>
      {connectError && (
        <Text textAlign={TEXT_ALIGN.CENTER} marginTop={3} padding={[2, 7, 5]}>
          {connectError}
        </Text>
      )}

      {selectError && (
        <Text textAlign={TEXT_ALIGN.CENTER} marginTop={3} padding={[2, 7, 5]}>
          {selectError}
        </Text>
      )}

      {!accounts && !selectedCustodianType ? (
        <Box
          padding={[0, 7, 2]}
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.COLUMN}
        >
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            size={IconSize.Sm}
            color={Color.iconDefault}
            onClick={() => history.push(DEFAULT_ROUTE)}
            display={DISPLAY.FLEX}
          />
          <Text
            as="h4"
            variant={TextVariant.bodyLgMedium}
            marginTop={4}
            marginBottom={4}
          >
            {t('connectCustodialAccountTitle')}
          </Text>
          <Text
            as="h6"
            color={TextColor.textDefault}
            marginTop={2}
            marginBottom={5}
          >
            {t('connectCustodialAccountMsg')}
          </Text>
          <Box>
            <ul width={BLOCK_SIZES.FULL}>{custodianButtons}</ul>
          </Box>
        </Box>
      ) : null}

      {!accounts && selectedCustodianType && (
        <>
          <Box
            padding={[0, 7, 2]}
            display={DISPLAY.FLEX}
            flexDirection={FLEX_DIRECTION.COLUMN}
          >
            <ButtonIcon
              ariaLabel={t('back')}
              iconName={IconName.ArrowLeft}
              size={IconSize.Sm}
              color={Color.iconAlternative}
              onClick={() => cancelConnectCustodianToken()}
              display={[DISPLAY.FLEX]}
            />
            <Text as="h4">
              <Box display={DISPLAY.FLEX} alignItems={AlignItems.center}>
                {selectedCustodianImage && (
                  <img
                    width={32}
                    height={32}
                    src={selectedCustodianImage}
                    alt={selectedCustodianDisplayName}
                  />
                )}
                <Text marginLeft={2}>{selectedCustodianDisplayName}</Text>
              </Box>
            </Text>
            <Text marginTop={4} marginBottom={4}>
              {t('enterCustodianToken', [selectedCustodianDisplayName])}
            </Text>
          </Box>
          <Box paddingTop={7} paddingBottom={7}>
            <JwtUrlForm
              jwtList={jwtList}
              currentJwt={currentJwt}
              onJwtChange={(jwt) => setCurrentJwt(jwt)}
              jwtInputText={t('pasteJWTToken')}
              apiUrl={apiUrl}
              urlInputText={t('custodyApiUrl', [selectedCustodianDisplayName])}
              onUrlChange={(url) => setApiUrl(url)}
            />
            <Box
              display={DISPLAY.FLEX}
              flexDirection={FLEX_DIRECTION.ROW}
              justifyContent={JustifyContent.center}
              padding={[4, 0]}
            >
              <Button
                type={BUTTON_VARIANT.SECONDARY}
                marginRight={4}
                onClick={() => {
                  cancelConnectCustodianToken();
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                data-testid="jwt-form-connect-button"
                onClick={connect}
                disabled={
                  !selectedCustodianName || (addNewTokenClicked && !currentJwt)
                }
              >
                {t('connect')}
              </Button>
            </Box>
          </Box>
        </>
      )}

      {accounts && accounts.length > 0 && (
        <>
          <Box
            borderColor={BorderColor.borderDefault}
            padding={[5, 7, 2]}
            width={BLOCK_SIZES.FULL}
          >
            <Text as="h4">{t('selectAnAccount')}</Text>
            <Text marginTop={2} marginBottom={5}>
              {t('selectAnAccountHelp')}
            </Text>
          </Box>
          <Box
            padding={[5, 7, 0]}
            display={DISPLAY.FLEX}
            flexDirection={FLEX_DIRECTION.ROW}
            justifyContent={JustifyContent.flexStart}
            alignItems={AlignItems.center}
          >
            <input
              type="checkbox"
              id="selectAllAccounts"
              name="selectAllAccounts"
              marginRight={2}
              marginLeft={2}
              value={{}}
              onChange={(e) => setSelectAllAccounts(e)}
              checked={Object.keys(selectedAccounts).length === accounts.length}
            />
            <Label htmlFor="selectAllAccounts">{t('selectAllAccounts')}</Label>
          </Box>
          <CustodyAccountList
            custody={selectedCustodianName}
            accounts={accounts}
            onAccountChange={(account) => {
              if (selectedAccounts[account.address]) {
                delete selectedAccounts[account.address];
              } else {
                selectedAccounts[account.address] = {
                  name: account.name,
                  custodianDetails: account.custodianDetails,
                  labels: account.labels,
                  token: currentJwt,
                  apiUrl,
                  chainId: account.chainId,
                  custodyType: selectedCustodianType,
                  custodyName: selectedCustodianName,
                };
              }

              setSelectedAccounts(selectedAccounts);
            }}
            selectedAccounts={selectedAccounts}
            onAddAccounts={async () => {
              try {
                await dispatch(
                  mmiActions.connectCustodyAddresses(
                    selectedCustodianType,
                    selectedCustodianName,
                    selectedAccounts,
                  ),
                );
                const selectedCustodian = custodians.find(
                  (custodian) => custodian.name === selectedCustodianName,
                );
                history.push({
                  pathname: CUSTODY_ACCOUNT_DONE_ROUTE,
                  state: {
                    imgSrc: selectedCustodian.iconUrl,
                    title: t('custodianAccountAddedTitle'),
                    description: t('custodianAccountAddedDesc'),
                  },
                });
                trackEvent({
                  category: 'MMI',
                  event: 'Custodial accounts connected',
                  properties: {
                    custodian: selectedCustodianName,
                    numberOfAccounts: Object.keys(selectedAccounts).length,
                    chainId,
                  },
                });
              } catch (e) {
                setSelectError(e.message);
              }
            }}
            onCancel={() => {
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
                  chainId,
                },
              });
            }}
          />
        </>
      )}

      {accounts && accounts.length === 0 && (
        <Box
          data-testid="custody-accounts-empty"
          padding={[6, 7, 2]}
          className="custody-accounts-empty"
        >
          <Text
            marginBottom={2}
            fontWeight={FONT_WEIGHT.BOLD}
            color={TextColor.textDefault}
            variant={TextVariant.bodySm}
          >
            {t('allCustodianAccountsConnectedTitle')}
          </Text>
          <Text variant={TextVariant.bodyXs}>
            {t('allCustodianAccountsConnectedSubtitle')}
          </Text>

          <Box padding={[5, 7]} className="custody-accounts-empty__footer">
            <Button
              size={BUTTON_SIZES.LG}
              type={BUTTON_VARIANT.SECONDARY}
              onClick={() => history.push(DEFAULT_ROUTE)}
            >
              {t('close')}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CustodyPage;
