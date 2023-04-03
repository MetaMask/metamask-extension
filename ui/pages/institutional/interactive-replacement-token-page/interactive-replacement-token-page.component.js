import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import copy from 'copy-to-clipboard';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { showInteractiveReplacementTokenBanner } from '../../../store/actions';
import { getMetaMaskAccounts } from '../../../selectors';
import Button from '../../../components/ui/button';
import CustodyLabels from '../../../../components/institutional/custody-labels';
import PulseLoader from '../../../components/ui/pulse-loader';
import { INSTITUTIONAL_FEATURES_DONE_ROUTE } from '../../../helpers/constants/routes';
import { MAINNET_DEFAULT_BLOCK_EXPLORER_URL } from '../../../../shared/constants/swaps';
import { SECOND } from '../../../../shared/constants/time';
import { shortenAddress } from '../../../helpers/utils/util';
import Tooltip from '../../../components/ui/tooltip';
import CopyIcon from '../../../components/ui/icon/copy-icon.component';
import OpenInNewTab from '../../../components/ui/icon/open-in-new-tab.component';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import Box from '../../../components/ui/box';
import {
  Text,
  Label,
  Icon,
  ICON_NAMES,
  ICON_SIZES,
  ButtonLink,
} from '../../../components/component-library';
import {
  Color,
  TextVariant,
  JustifyContent,
  BLOCK_SIZES,
  DISPLAY,
} from '../../../helpers/constants/design-system';

export default function InteractiveReplacementTokenPage({ history }) {
  const timerRef = useRef(null);
  const isMountedRef = useRef(false);
  const dispatch = useDispatch();
  const mmiActions = mmiActionsFactory();
  const {
    selectedAddress,
    custodyAccountDetails,
    interactiveReplacementToken,
    mmiConfiguration,
  } = useSelector((state) => state.metamask);
  const { custodianName } =
    custodyAccountDetails[toChecksumHexAddress(selectedAddress)] || {};
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
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const t = useI18nContext();

  const {
    removeAddTokenConnectRequest,
    setCustodianNewRefreshToken,
    getCustodianAccounts,
  } = mmiActions();

  const connectRequest = connectRequests ? connectRequests[0] : undefined;

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
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
          (account) =>
            metaMaskAccounts[account.address.toLowerCase()] !== undefined,
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
        setError(true);
        setIsLoading(false);
      }
    };

    getTokenAccounts();
    return () => {
      isMountedRef.current = false;
    };
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
          description: t(t('custodianReplaceRefreshTokenChangedSubtitle')),
        },
      });

      if (isMountedRef.current) {
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyAddressButton = (account) => {
    setCopied(true);
    timerRef.current = setTimeout(() => setCopied(false), SECOND * 3);
    copy(account.address);
  };

  const renderAccounts = () => {
    const tooltipText = copied ? t('copiedExclamation') : t('copyToClipboard');

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
                        onClick={() => copyAddressButton(account)}
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

  return (
    <div className="page-container">
      <div className={`page-container__header ${error && 'error'}`}>
        <div className="page-container__title">
          {t('custodianReplaceRefreshTokenTitle')}{' '}
          {error ? t('failed').toLowerCase() : ''}
        </div>
        {!error && (
          <div className="page-container__subtitle">
            {t('custodianReplaceRefreshTokenSubtitle')}
          </div>
        )}
      </div>

      <div className="page-container__content">
        <div className="interactive-replacement-token-page">
          {error ? (
            <div className="interactive-replacement-token-page__accounts__error">
              {t('custodianReplaceRefreshTokenChangedFailed', [
                custodian.displayName || 'Custodian',
              ])}
            </div>
          ) : null}
          {renderAccounts()}
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
      </div>
    </div>
  );
}

InteractiveReplacementTokenPage.propTypes = {
  history: PropTypes.object,
};
