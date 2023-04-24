import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { getMetaMaskAccounts } from '../../../selectors';
import Button from '../../../components/ui/button';
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
import Box from '../../../components/ui/box';
import {
  Text,
  Label,
  Icon,
  ButtonLink,
  IconName,
  IconSize,
} from '../../../components/component-library';
import {
  Color,
  OVERFLOW_WRAP,
  TextColor,
  JustifyContent,
  BLOCK_SIZES,
  DISPLAY,
  FLEX_DIRECTION,
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
  const { address } = useSelector((state) => state.metamask.modal.props);
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
    custodians.find((item) => item.name === custodianName) || {};
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const metaMaskAccounts = useSelector(getMetaMaskAccounts);
  const connectRequests = useSelector(
    (state) => state.metamask.institutionalFeatures?.connectRequests,
  );
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
    const getTokenAccounts = async () => {
      if (!connectRequest) {
        history.push(mostRecentOverviewPage);
        return;
      }

      try {
        const custodianAccounts = await dispatch(
          getCustodianAccounts(
            connectRequest.token,
            connectRequest.apiUrl,
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

        if (isMountedRef.current) {
          setTokenAccounts(mappedAccounts);
          setIsLoading(false);
        }
      } catch (e) {
        console.log(e);
        setError(true);
        setIsLoading(false);
      }
    };

    getTokenAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!connectRequest) {
    history.push(mostRecentOverviewPage);
    return null;
  }

  const onRemoveAddTokenConnectRequest = ({ origin, apiUrl, token }) => {
    dispatch(
      removeAddTokenConnectRequest({
        origin,
        apiUrl,
        token,
      }),
    );
  };

  const handleReject = () => {
    onRemoveAddTokenConnectRequest(connectRequest);
    history.push(mostRecentOverviewPage);
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
              newAuthDetails: {
                refreshToken: connectRequest.token,
                refreshTokenUrl: connectRequest.apiUrl,
              },
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
          display={DISPLAY.FLEX}
          marginRight={7}
          marginLeft={7}
          overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
          color={TextColor.textAlternative}
          className="interactive-replacement-token-page"
        >
          {error ? (
            <Text data-testid="connect-error-message">
              {t('custodianReplaceRefreshTokenChangedFailed', [
                custodian.displayName || 'Custodian',
              ])}
            </Text>
          ) : null}
          <Box
            display={DISPLAY.FLEX}
            flexDirection={FLEX_DIRECTION.COLUMN}
            width={BLOCK_SIZES.FULL}
            data-testid="interactive-replacement-token-page"
          >
            {tokenAccounts.map((account, idx) => {
              return (
                <Box
                  display={DISPLAY.FLEX}
                  className="interactive-replacement-token-page__item"
                  key={account.address}
                >
                  <Box
                    display={DISPLAY.FLEX}
                    flexDirection={FLEX_DIRECTION.COLUMN}
                    width={BLOCK_SIZES.FULL}
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
                        display={DISPLAY.FLEX}
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
                            color={Color.primaryDefault}
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
                              size={IconSize.Xs}
                              color={Color.iconMuted}
                            />
                          </button>
                        </Tooltip>
                      </Text>
                    </Label>
                    <Box
                      display={DISPLAY.FLEX}
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
        </Box>
      </Box>
      <Box className="page-container__footer">
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
              onClick={handleReject}
            >
              {t('reject')}
            </Button>
            <Button
              type="primary"
              large
              className="page-container__footer-button"
              onClick={handleApprove}
            >
              {error
                ? custodian.displayName || 'Custodian'
                : t('approveButtonText')}
            </Button>
          </footer>
        )}
      </Box>
    </Box>
  );
}

InteractiveReplacementTokenPage.propTypes = {
  history: PropTypes.object,
};
