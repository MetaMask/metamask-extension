import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Location as HistoryLocation } from 'history';
import {
  Box,
  Button,
  ButtonLink,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Label,
  Text,
} from '../../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  OverflowWrap,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { getMetaMaskAccounts } from '../../../selectors';
import { getInstitutionalConnectRequests } from '../../../ducks/institutional/institutional';
import { getSelectedInternalAccount } from '../../../selectors/selectors';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/swaps';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  mmiActionsFactory,
  showInteractiveReplacementTokenBanner,
} from '../../../store/institutional/institution-background';
import CustodyLabels from '../../../components/institutional/custody-labels';
import { INSTITUTIONAL_FEATURES_DONE_ROUTE } from '../../../helpers/constants/routes';
import PulseLoader from '../../../components/ui/pulse-loader';
import Tooltip from '../../../components/ui/tooltip';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { shortenAddress } from '../../../helpers/utils/util';

const getButtonLinkHref = ({ address }: { address: string }) => {
  const url = SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[CHAIN_IDS.MAINNET];
  return `${url}address/${address}`;
};

type LabelItem = {
  key: string;
  value: string;
};

type TokenAccount = {
  address: string;
  name: string;
  labels: LabelItem[];
  balance: number;
};

type ConnectRequest = {
  origin: string;
  environment: string;
  token: string;
  service: string;
  labels: LabelItem[];
};

type Custodian = {
  envName: string;
  iconUrl?: string;
  displayName: string;
};

type State = {
  metamask: {
    custodyAccountDetails: { [address: string]: { custodianName?: string } };
    interactiveReplacementToken?: { url: string };
    mmiConfiguration: { custodians: Custodian[] };
  };
  appState: {
    modal: {
      modalState: {
        props?: { address: string };
      };
    };
  };
};

const InteractiveReplacementTokenPage: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const isMountedRef = useRef(false);
  const mmiActions = mmiActionsFactory();
  const address = useSelector(
    (state: State) => state.appState.modal.modalState.props?.address,
  );
  const {
    custodyAccountDetails,
    interactiveReplacementToken,
    mmiConfiguration,
  } = useSelector((state: State) => state.metamask);
  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const { custodianName } =
    custodyAccountDetails[toChecksumHexAddress(address || selectedAddress)] ||
    {};
  const { url } = interactiveReplacementToken || {};
  const { custodians } = mmiConfiguration;
  const custodian: Custodian | undefined = custodians.find(
    (item) => item.envName === custodianName,
  );
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const metaMaskAccounts = useSelector(getMetaMaskAccounts);
  const connectRequests = useSelector(getInstitutionalConnectRequests);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
  const [error, setError] = useState(false);
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();
  const {
    removeAddTokenConnectRequest,
    setCustodianNewRefreshToken,
    getCustodianAccounts,
  } = mmiActions;
  const connectRequest = connectRequests ? connectRequests[0] : undefined;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const getTokenAccounts = async () => {
      if (!connectRequest) {
        history.push(mostRecentOverviewPage);
        setIsLoading(false);
        return;
      }

      try {
        const custodianAccounts = (await dispatch(
          getCustodianAccounts(
            connectRequest.token,
            connectRequest.environment,
            connectRequest.service,
            false,
          ),
        )) as unknown as TokenAccount[];

        const filteredAccounts = custodianAccounts.filter(
          (account: TokenAccount) =>
            metaMaskAccounts[account.address.toLowerCase()],
        );

        const mappedAccounts = filteredAccounts.map(
          (account: TokenAccount) => ({
            address: account.address,
            name: account.name,
            labels: account.labels,
            balance:
              metaMaskAccounts[account.address.toLowerCase()]?.balance || 0,
          }),
        );

        if (isMounted) {
          setTokenAccounts(mappedAccounts);
          setIsLoading(false);
        }
      } catch (e) {
        setError(true);
        setIsLoading(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getTokenAccounts();

    return () => {
      isMounted = false;
    };
    // We just want to get the accounts in the render of the component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!connectRequest) {
      history.push(mostRecentOverviewPage);
      setIsLoading(false);
    }
  }, [connectRequest, history, mostRecentOverviewPage]);

  if (!connectRequest) {
    return null;
  }

  const onRemoveAddTokenConnectRequest = ({
    origin,
    environment,
    token,
  }: ConnectRequest) => {
    dispatch(
      removeAddTokenConnectRequest({
        origin,
        environment,
        token,
      }),
    );
  };

  const handleReject = () => {
    setIsLoading(true);
    onRemoveAddTokenConnectRequest(connectRequest);
  };

  const handleApprove = async () => {
    if (error) {
      global.platform.openTab({
        url: url || '',
      });
      handleReject();
      return;
    }

    setIsLoading(true);

    try {
      await Promise.all(
        tokenAccounts.map(async (account) => {
          await dispatch(
            setCustodianNewRefreshToken({
              address: account.address,
              refreshToken: connectRequest.token,
            }),
          );
        }),
      );

      dispatch(showInteractiveReplacementTokenBanner({}));

      onRemoveAddTokenConnectRequest(connectRequest);

      const state = {
        imgSrc: custodian?.iconUrl,
        title: t('custodianReplaceRefreshTokenChangedTitle'),
        description: t('custodianReplaceRefreshTokenChangedSubtitle'),
      };
      const newLocation: Partial<HistoryLocation> = {
        pathname: INSTITUTIONAL_FEATURES_DONE_ROUTE,
        state,
      };

      history.push(newLocation);

      if (isMountedRef.current) {
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box className="page-container" data-testid="interactive-replacement-token">
      <Box className={`page-container__header ${error && 'error'}`}>
        <Box className="page-container__title">
          {t('custodianReplaceRefreshTokenTitle')}{' '}
          {error ? t('failed').toLowerCase() : ''}
        </Box>
        {!error && (
          <Box className="page-container__subtitle">
            {t('custodianReplaceRefreshTokenSubtitle')}
          </Box>
        )}
      </Box>
      <Box className="page-container__content">
        <Box
          display={Display.Flex}
          marginRight={7}
          marginLeft={7}
          color={TextColor.textAlternative}
          className="interactive-replacement-token-page"
        >
          {error ? (
            <Text
              data-testid="connect-error-message"
              overflowWrap={OverflowWrap.BreakWord}
            >
              {t('custodianReplaceRefreshTokenChangedFailed', [
                custodian?.displayName || 'Custodian',
              ])}
            </Text>
          ) : (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              width={BlockSize.Full}
              data-testid="interactive-replacement-token-page"
            >
              {tokenAccounts.map((account, idx) => {
                return (
                  <Box
                    display={Display.Flex}
                    className="interactive-replacement-token-page__item"
                    key={account.address}
                  >
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                      width={BlockSize.Full}
                    >
                      <Label
                        marginTop={3}
                        marginRight={2}
                        htmlFor={`address-${idx}`}
                      >
                        <Text
                          as="span"
                          data-testid="account-name"
                          overflowWrap={OverflowWrap.BreakWord}
                        >
                          {account.name}
                        </Text>
                      </Label>
                      <Label
                        marginTop={1}
                        marginRight={2}
                        htmlFor={`address-${idx}`}
                      >
                        <Text
                          as="span"
                          display={Display.Flex}
                          className="interactive-replacement-token-page__item__address"
                          overflowWrap={OverflowWrap.BreakWord}
                        >
                          <ButtonLink
                            href={getButtonLinkHref(account)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {shortenAddress(account.address)}
                            <Icon
                              name={IconName.Export}
                              size={IconSize.Sm}
                              color={IconColor.primaryDefault}
                              marginLeft={1}
                            />
                          </ButtonLink>
                          <Tooltip
                            position="bottom"
                            title={
                              copied
                                ? t('copiedExclamation')
                                : t('copyToClipboard')
                            }
                          >
                            <button
                              className="interactive-replacement-token-page__item-clipboard"
                              onClick={() => handleCopy(account.address)}
                            >
                              <Icon
                                name={IconName.Copy}
                                size={IconSize.Sm}
                                color={IconColor.iconMuted}
                              />
                            </button>
                          </Tooltip>
                        </Text>
                      </Label>
                      <Box
                        display={Display.Flex}
                        justifyContent={JustifyContent.spaceBetween}
                      >
                        {account.labels && (
                          <CustodyLabels
                            labels={account.labels}
                            index={idx.toString()}
                            hideNetwork
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
      <Box as="footer" className="page-container__footer" padding={4}>
        {isLoading ? (
          <PulseLoader />
        ) : (
          <Box display={Display.Flex} gap={4}>
            <Button
              block
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              onClick={handleReject}
            >
              {t('reject')}
            </Button>
            <Button
              block
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              onClick={handleApprove}
            >
              {error
                ? custodian?.displayName || 'Custodian'
                : t('approveButtonText')}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default InteractiveReplacementTokenPage;
