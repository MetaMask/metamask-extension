import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useContext,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  ButtonIcon,
  Button,
  Label,
  IconName,
  IconSize,
  ButtonSize,
  ButtonVariant,
  Box,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FontWeight,
  Color,
  JustifyContent,
  BorderRadius,
  BorderColor,
  BlockSize,
  TextColor,
  TextAlign,
  TextVariant,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import {
  CUSTODY_ACCOUNT_DONE_ROUTE,
  CUSTODY_ACCOUNT_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import { getCurrentChainId, getSelectedAddress } from '../../../selectors';
import { getMMIConfiguration } from '../../../selectors/institutional/selectors';
import { getInstitutionalConnectRequests } from '../../../ducks/institutional/institutional';
import CustodyAccountList from '../connect-custody/account-list';
import JwtUrlForm from '../../../components/institutional/jwt-url-form';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import PulseLoader from '../../../components/ui/pulse-loader/pulse-loader';
import ConfirmConnectCustodianModal from '../confirm-connect-custodian-modal';
import { findCustodianByEnvName } from '../../../helpers/utils/institutional/find-by-custodian-name';
import { setSelectedAddress } from '../../../store/actions';

const GK8_DISPLAY_NAME = 'gk8';

const CustodyPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();

  const mmiActions = mmiActionsFactory();
  const currentChainId = useSelector(getCurrentChainId);
  const { custodians } = useSelector(getMMIConfiguration);

  const [loading, setLoading] = useState(true);
  const [
    isConfirmConnectCustodianModalVisible,
    setIsConfirmConnectCustodianModalVisible,
  ] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState({});
  const [selectedCustodianName, setSelectedCustodianName] = useState('');
  const [selectedCustodianImage, setSelectedCustodianImage] = useState(null);
  const [selectedCustodianDisplayName, setSelectedCustodianDisplayName] =
    useState('');
  const [matchedCustodian, setMatchedCustodian] = useState(null);
  const [selectedCustodianType, setSelectedCustodianType] = useState('');
  const [connectError, setConnectError] = useState('');
  const [currentJwt, setCurrentJwt] = useState('');
  const [selectError, setSelectError] = useState('');
  const [jwtList, setJwtList] = useState([]);
  const [addNewTokenClicked, setAddNewTokenClicked] = useState(false);
  const [chainId, setChainId] = useState(parseInt(currentChainId, 16));
  const connectRequests = useSelector(getInstitutionalConnectRequests, isEqual);
  const [accounts, setAccounts] = useState();
  const address = useSelector(getSelectedAddress);
  const connectRequest = connectRequests ? connectRequests[0] : undefined;
  const isCheckBoxSelected =
    accounts && Object.keys(selectedAccounts).length === accounts.length;

  const custodianButtons = useMemo(() => {
    const custodianItems = [];

    const sortedCustodians = [...custodians]
      .filter((item) => item.type !== 'Jupiter')
      .sort((a, b) =>
        a.envName.toLowerCase().localeCompare(b.envName.toLowerCase()),
      );

    function shouldShowInProduction(custodian) {
      return (
        'production' in custodian &&
        !custodian.production &&
        process.env.METAMASK_ENVIRONMENT === 'production'
      );
    }

    function isHidden(custodian) {
      return 'hidden' in custodian && custodian.hidden;
    }

    function isNotSelectedCustodian(custodian) {
      return (
        'envName' in custodian &&
        connectRequest &&
        Object.keys(connectRequest).length &&
        custodian.envName !== selectedCustodianName
      );
    }

    async function handleButtonClick(custodian) {
      try {
        const custodianByDisplayName = findCustodianByEnvName(
          custodian.envName,
          custodians,
        );

        const jwtListValue = await dispatch(
          mmiActions.getCustodianJWTList(custodian.envName),
        );

        setSelectedCustodianName(custodian.envName);
        setSelectedCustodianDisplayName(custodian.displayName);
        setSelectedCustodianImage(custodian.iconUrl);
        setCurrentJwt(jwtListValue[0] || '');
        setJwtList(jwtListValue);

        // open confirm Connect Custodian modal except for gk8
        if (
          custodianByDisplayName?.displayName?.toLocaleLowerCase() ===
          GK8_DISPLAY_NAME
        ) {
          setSelectedCustodianType(custodian.type);
        } else {
          setMatchedCustodian(custodianByDisplayName);
          setIsConfirmConnectCustodianModalVisible(true);
        }

        trackEvent({
          category: MetaMetricsEventCategory.MMI,
          event: MetaMetricsEventName.CustodianSelected,
          properties: {
            custodian: custodian.envName,
          },
        });
      } catch (error) {
        console.error('Error:', error);
      }
    }

    sortedCustodians.forEach((custodian) => {
      if (
        shouldShowInProduction(custodian) ||
        isHidden(custodian) ||
        isNotSelectedCustodian(custodian)
      ) {
        return;
      }

      custodianItems.push(
        <Box
          key={custodian.envName}
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
          borderColor={BorderColor.borderDefault}
          borderRadius={BorderRadius.SM}
          padding={4}
          marginBottom={4}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center}>
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
            size={ButtonSize.Sm}
            data-testid="custody-connect-button"
            onClick={() => handleButtonClick(custodian)}
          >
            {t('select')}
          </Button>
        </Box>,
      );
    });

    return custodianItems;
  }, [
    connectRequest,
    custodians,
    dispatch,
    mmiActions,
    selectedCustodianName,
    t,
    trackEvent,
  ]);

  const handleConnectError = useCallback(
    (e) => {
      const getErrorMessage = (error) => {
        const detailedError = error.message.split(':');
        const errorCode = parseInt(detailedError[0], 10);

        if (detailedError.length > 1 && !isNaN(errorCode)) {
          switch (errorCode) {
            case 401:
              return 'Authentication error. Please ensure you have entered the correct token';
            default:
              return null;
          }
        }

        return error.message;
      };

      const errorMessage = getErrorMessage(e);

      setConnectError(
        `Something went wrong connecting your custodian account. Error details: ${errorMessage}`,
      );
      trackEvent({
        category: MetaMetricsEventCategory.MMI,
        event: MetaMetricsEventName.CustodianConnectionFailed,
        properties: {
          custodian: selectedCustodianName,
        },
      });
    },
    [selectedCustodianName, trackEvent],
  );

  useEffect(() => {
    const fetchConnectRequest = async () => {
      try {
        if (connectRequest && Object.keys(connectRequest).length) {
          const {
            token,
            environment: custodianName, // this is the env name
            service: custodianType,
          } = connectRequest;

          const custodianToken =
            token || (await dispatch(mmiActions.getCustodianToken(address)));

          setCurrentJwt(custodianToken);
          setSelectedCustodianType(custodianType);
          setSelectedCustodianName(custodianName || custodianType);
          setConnectError('');

          const accountsValue = await dispatch(
            mmiActions.getCustodianAccounts(
              custodianToken,
              custodianName || custodianType,
              custodianType,
              true,
            ),
          );

          setAccounts(accountsValue);

          trackEvent({
            category: MetaMetricsEventCategory.MMI,
            event: MetaMetricsEventName.CustodianConnected,
            properties: {
              custodian: custodianName,
              rpc: Boolean(connectRequest),
            },
          });
        }
      } catch (error) {
        console.error(error);
        handleConnectError(error);
      }
    };

    const handleFetchConnectRequest = () => {
      setLoading(true);
      fetchConnectRequest().finally(() => setLoading(false));
    };

    handleFetchConnectRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function handleNetworkChange() {
      if (!isNaN(chainId)) {
        const jwt = currentJwt || jwtList[0];

        if (jwt && jwt.length) {
          setAccounts(
            await dispatch(
              mmiActions.getCustodianAccounts(
                jwt,
                selectedCustodianName,
                selectedCustodianType,
                true,
              ),
            ),
          );
        }
      }
    }

    if (parseInt(chainId, 16) !== chainId) {
      setChainId(parseInt(currentChainId, 16));
      handleNetworkChange();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChainId]);

  const cancelConnectCustodianToken = () => {
    setSelectedCustodianName('');
    setSelectedCustodianType('');
    setSelectedCustodianImage(null);
    setSelectedCustodianDisplayName('');
    setCurrentJwt('');
    setConnectError('');
    setSelectError('');

    window.innerWidth > 400
      ? history.push(CUSTODY_ACCOUNT_ROUTE)
      : global.platform.closeCurrentWindow();
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

  if (loading) {
    return <PulseLoader />;
  }

  return (
    <Box
      className="main-container"
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      {connectError && (
        <Text
          data-testid="connect-error"
          textAlign={TextAlign.Center}
          marginTop={3}
          padding={[2, 7, 5]}
        >
          {connectError}
        </Text>
      )}
      {selectError && (
        <Text textAlign={TextAlign.Center} marginTop={3} padding={[2, 7, 5]}>
          {selectError}
        </Text>
      )}

      {!accounts && !selectedCustodianType && (
        <Box
          data-testid="connect-custodial-account"
          padding={4}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.Full}
        >
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            marginBottom={4}
            marginTop={4}
          >
            <ButtonIcon
              ariaLabel={t('back')}
              iconName={IconName.ArrowLeft}
              size={IconSize.Sm}
              color={Color.iconDefault}
              onClick={() => history.push(DEFAULT_ROUTE)}
              display={Display.Flex}
            />
            <Text>{t('back')}</Text>
          </Box>
          <Text as="h4" variant={TextVariant.bodyLgMedium} marginTop={4}>
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
            <ul width={BlockSize.Full}>{custodianButtons}</ul>
          </Box>
        </Box>
      )}
      {!accounts && selectedCustodianType && (
        <>
          <Box
            padding={4}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            className="page-container__content"
            width={BlockSize.Full}
          >
            {window.innerWidth > 400 && (
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                marginBottom={4}
                marginTop={4}
              >
                <ButtonIcon
                  data-testid="custody-back-button"
                  ariaLabel={t('back')}
                  iconName={IconName.ArrowLeft}
                  size={IconSize.Sm}
                  color={Color.iconDefault}
                  onClick={cancelConnectCustodianToken}
                  display={[Display.Flex]}
                />
                <Text>{t('back')}</Text>
              </Box>
            )}
            {selectedCustodianImage && (
              <Box display={Display.Flex} alignItems={AlignItems.center}>
                <img
                  width={32}
                  height={32}
                  src={selectedCustodianImage}
                  alt={selectedCustodianDisplayName}
                />
                <Text as="h4" marginLeft={2}>
                  {selectedCustodianDisplayName}
                </Text>
              </Box>
            )}
            <Text marginTop={4}>
              {t('enterCustodianToken', [selectedCustodianDisplayName])}
            </Text>
            <Box paddingBottom={7}>
              <JwtUrlForm
                jwtList={jwtList}
                currentJwt={currentJwt}
                onJwtChange={(jwt) => setCurrentJwt(jwt)}
                jwtInputText={t('pasteJWTToken')}
              />
            </Box>
          </Box>
          <Box as="footer" className="page-container__footer" padding={4}>
            {loading ? (
              <PulseLoader />
            ) : (
              <Box display={Display.Flex} gap={4}>
                <Button
                  data-testid="custody-cancel-button"
                  block
                  variant={ButtonVariant.Secondary}
                  size={ButtonSize.Lg}
                  onClick={cancelConnectCustodianToken}
                >
                  {t('cancel')}
                </Button>
                <Button
                  block
                  data-testid="jwt-form-connect-button"
                  size={ButtonSize.Lg}
                  onClick={async () => {
                    try {
                      setConnectError('');

                      const accountsValue = await dispatch(
                        mmiActions.getCustodianAccounts(
                          currentJwt || jwtList[0],
                          selectedCustodianName,
                          selectedCustodianType,
                          true,
                        ),
                      );

                      setAccounts(accountsValue);
                      trackEvent({
                        category: MetaMetricsEventCategory.MMI,
                        event: MetaMetricsEventName.CustodianConnected,
                        properties: {
                          custodian: selectedCustodianName,
                          rpc: Boolean(connectRequest),
                        },
                      });
                    } catch (e) {
                      handleConnectError(e);
                    }
                  }}
                  disabled={
                    !selectedCustodianName ||
                    (addNewTokenClicked && !currentJwt)
                  }
                >
                  {t('connect')}
                </Button>
              </Box>
            )}
          </Box>
        </>
      )}
      {accounts && accounts.length > 0 && (
        <CustodyAccountList
          custody={selectedCustodianName}
          accounts={accounts}
          onAccountChange={(account) => {
            setSelectedAccounts((prevSelectedAccounts) => {
              const updatedSelectedAccounts = { ...prevSelectedAccounts };

              if (updatedSelectedAccounts[account.address]) {
                delete updatedSelectedAccounts[account.address];
              } else {
                updatedSelectedAccounts[account.address] = {
                  name: account.name,
                  custodianDetails: account.custodianDetails,
                  labels: account.labels,
                  token: currentJwt,
                  chainId: account.chainId,
                  custodyType: selectedCustodianType,
                  custodyName: selectedCustodianName,
                };
              }

              return updatedSelectedAccounts;
            });
          }}
          selectedAccounts={selectedAccounts}
          onAddAccounts={async () => {
            try {
              const selectedCustodian = custodians.find(
                (custodian) => custodian.envName === selectedCustodianName,
              );
              const firstAccountKey = Object.keys(selectedAccounts).shift();

              await dispatch(
                mmiActions.connectCustodyAddresses(
                  selectedCustodianType,
                  selectedCustodianName,
                  selectedAccounts,
                ),
              );

              dispatch(setSelectedAddress(firstAccountKey.toLowerCase()));

              trackEvent({
                category: MetaMetricsEventCategory.MMI,
                event: MetaMetricsEventName.CustodialAccountsConnected,
                properties: {
                  custodian: selectedCustodianName,
                  numberOfAccounts: Object.keys(selectedAccounts).length,
                  chainId,
                },
              });

              history.push({
                pathname: CUSTODY_ACCOUNT_DONE_ROUTE,
                state: {
                  imgSrc: selectedCustodian && selectedCustodian.iconUrl,
                  title: t('custodianAccountAddedTitle', [
                    (selectedCustodian && selectedCustodian.displayName) ||
                      'Custodian',
                  ]),
                  description: t('custodianAccountAddedDesc'),
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
            setAddNewTokenClicked(false);

            history.push(DEFAULT_ROUTE);

            trackEvent({
              category: MetaMetricsEventCategory.MMI,
              event: MetaMetricsEventName.CustodianConnectionCanceled,
              properties: {
                custodian: selectedCustodianName,
                numberOfAccounts: Object.keys(selectedAccounts).length,
                chainId,
              },
            });
          }}
        >
          <Box paddingTop={4} paddingBottom={4} width={BlockSize.Full}>
            <Text as="h4">{t('selectAnAccount')}</Text>
            <Text marginTop={2} marginBottom={2}>
              {t('selectAnAccountHelp')}
            </Text>
          </Box>
          <Box
            paddingBottom={4}
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.flexStart}
            alignItems={AlignItems.center}
          >
            <input
              type="checkbox"
              id="selectAllAccounts"
              data-testid={`select-all-accounts-selected-${isCheckBoxSelected}`}
              name="selectAllAccounts"
              marginLeft={2}
              value={{}}
              onChange={(e) => setSelectAllAccounts(e)}
              checked={isCheckBoxSelected}
            />
            <Label marginLeft={2} htmlFor="selectAllAccounts">
              {t('selectAllAccounts')}
            </Label>
          </Box>
        </CustodyAccountList>
      )}
      {accounts && accounts.length === 0 && (
        <Box className="page-container">
          <Box
            data-testid="custody-accounts-empty"
            padding={7}
            className="page-container__content"
          >
            <Text
              marginBottom={2}
              fontWeight={FontWeight.Bold}
              color={TextColor.textDefault}
              variant={TextVariant.bodyLgMedium}
            >
              {t('allCustodianAccountsConnectedTitle')}
            </Text>
            <Text variant={TextVariant.bodyMd}>
              {t('allCustodianAccountsConnectedSubtitle')}
            </Text>
          </Box>
          <Box as="footer" className="page-container__footer" padding={4}>
            <Button
              block
              size={ButtonSize.Lg}
              type={ButtonVariant.Secondary}
              onClick={() => history.push(DEFAULT_ROUTE)}
            >
              {t('close')}
            </Button>
          </Box>
        </Box>
      )}

      {isConfirmConnectCustodianModalVisible && (
        <ConfirmConnectCustodianModal
          onModalClose={() => setIsConfirmConnectCustodianModalVisible(false)}
          custodianName={selectedCustodianDisplayName}
          custodianURL={
            matchedCustodian?.onboardingUrl || matchedCustodian?.website
          }
        />
      )}
    </Box>
  );
};

export default CustodyPage;
