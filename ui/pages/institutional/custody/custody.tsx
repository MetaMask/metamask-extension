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
import Fuse from 'fuse.js';
import { Location as HistoryLocation } from 'history';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  Button,
  Label,
  ButtonSize,
  Box,
  Text,
  TextFieldSearch,
  TextFieldSearchSize,
  ButtonIconSize,
} from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  BorderRadius,
  BorderColor,
  BlockSize,
  TextAlign,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import {
  CUSTODY_ACCOUNT_DONE_ROUTE,
  CUSTODY_ACCOUNT_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getCurrentChainId,
  getSelectedInternalAccount,
} from '../../../selectors';
import { getMMIConfiguration } from '../../../selectors/institutional/selectors';
import { getInstitutionalConnectRequests } from '../../../ducks/institutional/institutional';
import CustodyAccountList from '../account-list';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import PulseLoader from '../../../components/ui/pulse-loader/pulse-loader';
import ConfirmConnectCustodianModal from '../confirm-connect-custodian-modal';
import { findCustodianByEnvName } from '../../../helpers/utils/institutional/find-by-custodian-name';
import { setSelectedInternalAccount } from '../../../store/actions';
import QRCodeModal from '../../../components/institutional/qr-code-modal/qr-code-modal';
import ManualConnectCustodian from '../manual-connect-custodian';
import CustodianAccountsConnected from '../custodian-accounts-connected';
import CustodianListView from '../custodian-list-view';

export type LabelItem = {
  key: string;
  value: string;
};

export type CustodianDetails = {
  coin: string;
  id: string;
};

export type Account = {
  address: string;
  name: string;
  custodianDetails?: CustodianDetails;
  labels?: LabelItem[];
  chainId?: string;
  balance?: string;
  token?: string;
};

/**
 * @todo - Remove after MetaMask Institutional 778 PR is merged
 * and a new version for the package 'types' has been published
 * with the new ICustodianType
 */
type Custodian = {
  type: string;
  iconUrl: string;
  name: string;
  onboardingUrl: string;
  website: string;
  envName: string;
  apiUrl: string;
  apiVersion: string;
  displayName: string;
  refreshTokenUrl: string;
  websocketApiUrl: string;
  isNoteToTraderSupported: boolean;
  isQRCodeSupported: boolean;
  isManualTokenInputSupported?: boolean;
  custodianPublishesTransaction: boolean;
  production: boolean;
  version: number;
};

type AccountDetails = {
  name: string;
  custodianDetails?: CustodianDetails;
  labels?: LabelItem[];
  chainId?: string;
  balance?: string;
  token: string;
  custodyType: string;
  custodyName: string;
};

const CustodyPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();

  const mmiActions = mmiActionsFactory();
  const currentChainId = useSelector(getCurrentChainId);
  const mmiConfiguration = useSelector(getMMIConfiguration);
  const custodians: Custodian[] = mmiConfiguration?.custodians || [];

  const [loading, setLoading] = useState(true);
  const [
    isConfirmConnectCustodianModalVisible,
    setIsConfirmConnectCustodianModalVisible,
  ] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState({});
  const [selectedCustodianName, setSelectedCustodianName] = useState<
    string | null
  >('');
  const [selectedCustodianImage, setSelectedCustodianImage] = useState<
    string | null
  >(null);

  const [selectedCustodianDisplayName, setSelectedCustodianDisplayName] =
    useState('');
  const [matchedCustodian, setMatchedCustodian] = useState<Custodian | null>();
  const [selectedCustodianType, setSelectedCustodianType] = useState<
    string | null
  >('');
  const [connectError, setConnectError] = useState('');
  const [currentJwt, setCurrentJwt] = useState<string>('');
  const [selectError, setSelectError] = useState('');
  const [jwtList, setJwtList] = useState<string[]>([]);
  const [addNewTokenClicked, setAddNewTokenClicked] = useState(false);
  const [chainId, setChainId] = useState(parseInt(currentChainId, 16));
  const [accounts, setAccounts] = useState<Account[] | undefined | null>();
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [qrConnectionRequest, setQrConnectionRequest] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const connectRequests = useSelector(getInstitutionalConnectRequests, isEqual);
  const { address } = useSelector(getSelectedInternalAccount);
  const connectRequest = connectRequests ? connectRequests[0] : undefined;

  const isCheckBoxSelected = Boolean(
    accounts && Object.keys(selectedAccounts).length === accounts.length,
  );
  const custodianURL =
    matchedCustodian?.onboardingUrl || matchedCustodian?.website;

  let searchResults = accounts;

  if (searchQuery && accounts) {
    const fuse = new Fuse(accounts, {
      threshold: 0.0,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      tokenize: true,
      matchAllTokens: true,
      keys: ['name', 'address'],
    });

    searchResults = fuse.search(searchQuery);
  }

  const custodianListViewItems = useMemo(() => {
    const custodianItems: React.ReactNode[] = [];

    const sortedCustodians = [...(custodians || [])].sort((a, b) =>
      a.envName.toLowerCase().localeCompare(b.envName.toLowerCase()),
    );

    function shouldShowInProduction(custodian: Custodian) {
      return (
        'production' in custodian &&
        !custodian.production &&
        process.env.METAMASK_ENVIRONMENT === 'production'
      );
    }

    function isHidden(custodian: Custodian) {
      return 'hidden' in custodian && custodian.hidden;
    }

    function isNotSelectedCustodian(custodian: Custodian) {
      return (
        'envName' in custodian &&
        connectRequest &&
        Object.keys(connectRequest).length &&
        custodian.envName !== selectedCustodianName
      );
    }

    async function handleButtonClick(custodian: Custodian) {
      try {
        const custodianByDisplayName = findCustodianByEnvName(
          custodian.envName,
          custodians as Custodian[],
        ) as Custodian;

        // @ts-expect-error todo - come back later
        const jwtListValue: string[] = await dispatch(
          mmiActions.getCustodianJWTList(custodian.envName),
        );

        setSelectedCustodianName(custodian.envName);
        setSelectedCustodianDisplayName(custodian.displayName);
        setSelectedCustodianImage(custodian.iconUrl);
        setCurrentJwt(jwtListValue[0] || '');
        setJwtList(jwtListValue);

        if (custodianByDisplayName?.isManualTokenInputSupported) {
          setSelectedCustodianType(custodian.type);
        } else {
          setMatchedCustodian(custodianByDisplayName);
          custodianByDisplayName?.isQRCodeSupported
            ? setShowQRCodeModal(true)
            : setIsConfirmConnectCustodianModalVisible(true);
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
      const getErrorMessage = (error: Error) => {
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

  const removeConnectRequest = async () => {
    if (connectRequest) {
      await dispatch(
        mmiActions.removeAddTokenConnectRequest({
          origin: connectRequest.origin,
          environment: connectRequest.environment,
          token: connectRequest.token,
        }),
      );
    }
  };

  const fetchConnectRequest = useCallback(
    async (connectionRequest) => {
      try {
        if (connectionRequest && Object.keys(connectionRequest).length) {
          const {
            token,
            environment: custodianName, // this is the env name
            service: custodianType,
          } = connectionRequest;

          const custodianToken =
            token || (await dispatch(mmiActions.getCustodianToken(address)));

          setCurrentJwt(custodianToken);
          setSelectedCustodianType(custodianType);
          setSelectedCustodianName(custodianName || custodianType);
          setConnectError('');
          setQrConnectionRequest(null);

          const accountsValue = (await dispatch(
            mmiActions.getCustodianAccounts(
              custodianToken,
              custodianName || custodianType,
              custodianType,
              true,
            ),
          )) as unknown as Account[];

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
    },
    [
      address,
      connectRequest,
      dispatch,
      handleConnectError,
      mmiActions,
      trackEvent,
    ],
  );

  useEffect(() => {
    const handleFetchConnectRequest = () => {
      setLoading(true);
      fetchConnectRequest(connectRequest).finally(() => setLoading(false));
    };

    handleFetchConnectRequest();
  }, []);

  useEffect(() => {
    async function handleNetworkChange() {
      if (!isNaN(chainId)) {
        const jwt = currentJwt || jwtList[0];

        if (jwt?.length && selectedCustodianName && selectedCustodianType) {
          setAccounts(
            (await dispatch(
              mmiActions.getCustodianAccounts(
                jwt,
                selectedCustodianName,
                selectedCustodianType,
                true,
              ),
            )) as unknown as Account[],
          );
        }
      }
    }

    if (parseInt(String(chainId), 16) !== chainId) {
      setChainId(parseInt(currentChainId, 16));
      handleNetworkChange();
    }
  }, [currentChainId]);

  useEffect(() => {
    if (qrConnectionRequest) {
      setLoading(true);
      fetchConnectRequest(qrConnectionRequest).finally(() => setLoading(false));
    }
  }, [fetchConnectRequest, qrConnectionRequest]);

  const cancelConnectCustodianToken = async () => {
    await removeConnectRequest();
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

  const setSelectAllAccounts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allAccounts: {
      [key: string]: {
        name: string;
        custodianDetails?: CustodianDetails;
        token: string;
        labels?: LabelItem[];
        chainId?: string;
        custodyType: string;
        custodyName: string;
      };
    } = {};

    if (e.currentTarget.checked) {
      accounts &&
        accounts.forEach((account) => {
          allAccounts[account.address] = {
            name: account.name,
            custodianDetails: account.custodianDetails,
            labels: account.labels,
            token: currentJwt,
            chainId: account.chainId,
            custodyType: selectedCustodianType || '',
            custodyName: selectedCustodianName || '',
          };
        });
      setSelectedAccounts(allAccounts);
    } else {
      setSelectedAccounts({});
    }
  };

  const _setQrConnectionRequest = (message: string) => {
    setQrConnectionRequest(message);
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

      {/* Custodians list view */}
      {!accounts && !selectedCustodianType && (
        <CustodianListView custodianList={custodianListViewItems} />
      )}

      {/* Manual connect to a custodian */}
      {!accounts && selectedCustodianType && (
        <ManualConnectCustodian
          custodianImage={selectedCustodianImage}
          custodianDisplayName={selectedCustodianDisplayName}
          jwtList={jwtList}
          token={currentJwt}
          loading={loading}
          custodianName={selectedCustodianName || t('custodian')}
          custodianType={selectedCustodianType}
          addNewTokenClicked={addNewTokenClicked}
          connectRequest={connectRequest}
          setCurrentJwt={setCurrentJwt}
          setConnectError={setConnectError}
          handleConnectError={handleConnectError}
          setAccounts={setAccounts}
          removeConnectRequest={removeConnectRequest}
          cancelConnectCustodianToken={cancelConnectCustodianToken}
        />
      )}

      {/* Connect flow - select accounts from a custodian */}
      {accounts && accounts.length > 0 && (
        <CustodyAccountList
          custody={selectedCustodianName}
          accounts={searchResults || []}
          onAccountChange={(account) => {
            setSelectedAccounts((prevSelectedAccounts) => {
              const updatedSelectedAccounts: { [key: string]: AccountDetails } =
                { ...prevSelectedAccounts };

              if (updatedSelectedAccounts[account.address]) {
                delete updatedSelectedAccounts[account.address];
              } else {
                updatedSelectedAccounts[account.address] = {
                  name: account.name,
                  custodianDetails: account.custodianDetails,
                  labels: account.labels,
                  token: currentJwt,
                  chainId: account.chainId,
                  custodyType: selectedCustodianType || '',
                  custodyName: selectedCustodianName || '',
                };
              }

              return updatedSelectedAccounts;
            });
          }}
          selectedAccounts={selectedAccounts}
          onAddAccounts={async () => {
            try {
              const selectedCustodian = custodians?.find(
                (custodian: Custodian) =>
                  custodian.envName === selectedCustodianName,
              );
              const firstAccountId: string | undefined =
                Object.keys(selectedAccounts).shift();

              if (selectedCustodianType && selectedCustodianName) {
                await dispatch(
                  mmiActions.connectCustodyAddresses(
                    selectedCustodianType,
                    selectedCustodianName,
                    selectedAccounts as string[],
                  ),
                );
              }

              firstAccountId &&
                dispatch(setSelectedInternalAccount(firstAccountId));

              trackEvent({
                category: MetaMetricsEventCategory.MMI,
                event: MetaMetricsEventName.CustodialAccountsConnected,
                properties: {
                  custodian: selectedCustodianName,
                  numberOfAccounts: Object.keys(selectedAccounts).length,
                  chainId,
                },
              });

              await removeConnectRequest();

              const state = {
                imgSrc: selectedCustodian?.iconUrl,
                title: t('custodianAccountAddedTitle', [
                  selectedCustodian?.displayName || 'Custodian',
                ]),
                description: t('custodianAccountAddedDesc'),
              };
              const newLocation: Partial<HistoryLocation> = {
                pathname: CUSTODY_ACCOUNT_DONE_ROUTE,
                state,
              };

              history.push(newLocation);
            } catch (e) {
              if (e instanceof Error) {
                setSelectError(e.message);
              } else {
                setSelectError('An unknown error occurred');
              }
            }
          }}
          onCancel={async () => {
            await removeConnectRequest();
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
            <Text marginTop={2}>{t('selectAnAccountHelp')}</Text>
          </Box>
          {/* Search box */}
          {accounts.length > 1 ? (
            <Box paddingBottom={4} paddingTop={0}>
              <TextFieldSearch
                size={TextFieldSearchSize.Sm}
                width={BlockSize.Full}
                placeholder={t('searchAccounts')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                clearButtonOnClick={() => setSearchQuery('')}
                clearButtonProps={{
                  size: ButtonIconSize.Sm,
                }}
                inputProps={{ autoFocus: true }}
              />
            </Box>
          ) : null}
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
              value={''}
              onChange={(e) => setSelectAllAccounts(e)}
              checked={isCheckBoxSelected}
            />
            <Label marginLeft={2} htmlFor="selectAllAccounts">
              {t('selectAllAccounts')}
            </Label>
          </Box>
        </CustodyAccountList>
      )}

      {/* Connect flow - all accounts have been connect or there isn't any to conenct */}
      {accounts && accounts.length === 0 && <CustodianAccountsConnected />}

      {/* Modal with connect btn for each custodian in the list view */}
      {isConfirmConnectCustodianModalVisible && (
        <ConfirmConnectCustodianModal
          onModalClose={() => setIsConfirmConnectCustodianModalVisible(false)}
          custodianName={selectedCustodianDisplayName}
          custodianURL={custodianURL}
        />
      )}

      {showQRCodeModal && (
        <QRCodeModal
          onClose={() => {
            setShowQRCodeModal(false);
          }}
          custodianName={selectedCustodianDisplayName}
          custodianURL={custodianURL}
          setQrConnectionRequest={_setQrConnectionRequest}
        />
      )}
    </Box>
  );
};

export default CustodyPage;
