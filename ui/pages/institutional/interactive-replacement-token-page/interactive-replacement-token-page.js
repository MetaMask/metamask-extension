import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { getInstitutionalConnectRequests } from '../../../ducks/institutional/institutional';
import { getMetaMaskAccounts } from '../../../selectors';
import CustodyLabels from '../../../components/institutional/custody-labels/custody-labels';
import PulseLoader from '../../../components/ui/pulse-loader';
import { INSTITUTIONAL_FEATURES_DONE_ROUTE } from '../../../helpers/constants/routes';
import { SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/swaps';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { shortenAddress } from '../../../helpers/utils/util';
import Tooltip from '../../../components/ui/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  mmiActionsFactory,
  showInteractiveReplacementTokenBanner,
} from '../../../store/institutional/institution-background';
import {
  Label,
  Icon,
  ButtonLink,
  IconName,
  IconSize,
  Box,
  Button,
  BUTTON_VARIANT,
  BUTTON_SIZES,
  Text,
} from '../../../components/component-library';
import {
  OverflowWrap,
  TextColor,
  JustifyContent,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
} from '../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

const getButtonLinkHref = ({ address }) => {
  const url = SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[CHAIN_IDS.MAINNET];
  return `${url}address/${address}`;
};

export default function InteractiveReplacementTokenPage({ history }) {
  const dispatch = useDispatch();
  const isMountedRef = useRef(false);
  const mmiActions = mmiActionsFactory();
  const address = useSelector(
    (state) => state.appState.modal.modalState.props?.address,
  );
  const {
    selectedAddress,
    custodyAccountDetails,
    interactiveReplacementToken,
    mmiConfiguration,
  } = useSelector((state) => state.metamask);
  const { custodianName } =
    custodyAccountDetails[toChecksumHexAddress(address || selectedAddress)] ||
    {};
  const { url } = interactiveReplacementToken || {};
  const { custodians } = mmiConfiguration;
  const custodian =
    custodians.find((item) => item.envName === custodianName) || {};
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const metaMaskAccounts = useSelector(getMetaMaskAccounts);
  const connectRequests = useSelector(getInstitutionalConnectRequests);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenAccounts, setTokenAccounts] = useState([]);
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
    return () => (isMountedRef.current = false);
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
        const custodianAccounts = await dispatch(
          getCustodianAccounts(
            connectRequest.token,
            connectRequest.environment,
            connectRequest.service,
            false,
          ),
        );

        const filteredAccounts = custodianAccounts.filter(
          (account) => metaMaskAccounts[account.address.toLowerCase()],
        );

        const mappedAccounts = filteredAccounts.map((account) => ({
          address: account.address,
          name: account.name,
          labels: account.labels,
          balance:
            metaMaskAccounts[account.address.toLowerCase()]?.balance || 0,
        }));

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

  const onRemoveAddTokenConnectRequest = ({ origin, environment, token }) => {
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
        url,
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

      history.push({
        pathname: INSTITUTIONAL_FEATURES_DONE_ROUTE,
        state: {
          imgSrc: custodian?.iconUrl,
          title: t('custodianReplaceRefreshTokenChangedTitle'),
          description: t('custodianReplaceRefreshTokenChangedSubtitle'),
        },
      });

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
          overflowwrap={OverflowWrap.BreakWord}
          color={TextColor.textAlternative}
          className="interactive-replacement-token-page"
        >
          {error ? (
            <Text data-testid="connect-error-message">
              {t('custodianReplaceRefreshTokenChangedFailed', [
                custodian.displayName || 'Custodian',
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
                        <Text as="span" data-testid="account-name">
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
              variant={BUTTON_VARIANT.SECONDARY}
              size={BUTTON_SIZES.LG}
              onClick={handleReject}
            >
              {t('reject')}
            </Button>
            <Button
              block
              variant={BUTTON_VARIANT.PRIMARY}
              size={BUTTON_SIZES.LG}
              onClick={handleApprove}
            >
              {error
                ? custodian.displayName || 'Custodian'
                : t('approveButtonText')}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

InteractiveReplacementTokenPage.propTypes = {
  history: PropTypes.object,
};
