import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  ASSET_ROUTE,
  IMPORT_TOKEN_ROUTE,
} from '../../helpers/constants/routes';
import Button from '../../components/ui/button';
import Identicon from '../../components/ui/identicon';
import TokenBalance from '../../components/ui/token-balance';
import { I18nContext } from '../../contexts/i18n';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getPendingTokens } from '../../ducks/metamask/metamask';
import { addTokens, clearPendingTokens } from '../../store/actions';
import { TOKEN_STANDARDS } from '../../helpers/constants/common';
import { EVENT, EVENT_NAMES } from '../../../shared/constants/metametrics';
import { ASSET_TYPES } from '../../../shared/constants/transaction';

const getTokenName = (name, symbol) => {
  return name === undefined ? symbol : `${name} (${symbol})`;
};

const ConfirmImportToken = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const pendingTokens = useSelector(getPendingTokens);

  const handleAddTokens = useCallback(async () => {
    await dispatch(addTokens(pendingTokens));

    const addedTokenValues = Object.values(pendingTokens);
    const firstTokenAddress = addedTokenValues?.[0].address?.toLowerCase();

    addedTokenValues.forEach((pendingToken) => {
      trackEvent({
        event: EVENT_NAMES.TOKEN_ADDED,
        category: EVENT.CATEGORIES.WALLET,
        sensitiveProperties: {
          token_symbol: pendingToken.symbol,
          token_contract_address: pendingToken.address,
          token_decimal_precision: pendingToken.decimals,
          unlisted: pendingToken.unlisted,
          source: pendingToken.isCustom
            ? EVENT.SOURCE.TOKEN.CUSTOM
            : EVENT.SOURCE.TOKEN.LIST,
          token_standard: TOKEN_STANDARDS.ERC20,
          asset_type: ASSET_TYPES.TOKEN,
        },
      });
    });

    dispatch(clearPendingTokens());

    if (firstTokenAddress) {
      history.push(`${ASSET_ROUTE}/${firstTokenAddress}`);
    } else {
      history.push(mostRecentOverviewPage);
    }
  }, [dispatch, history, mostRecentOverviewPage, pendingTokens, trackEvent]);

  useEffect(() => {
    if (Object.keys(pendingTokens).length === 0) {
      history.push(mostRecentOverviewPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-container">
      <div className="page-container__header">
        <div className="page-container__title">
          {t('importTokensCamelCase')}
        </div>
        <div className="page-container__subtitle">
          {t('likeToImportTokens')}
        </div>
      </div>
      <div className="page-container__content">
        <div className="confirm-import-token">
          <div className="confirm-import-token__header">
            <div className="confirm-import-token__token">{t('token')}</div>
            <div className="confirm-import-token__balance">{t('balance')}</div>
          </div>
          <div className="confirm-import-token__token-list">
            {Object.entries(pendingTokens).map(([address, token]) => {
              const { name, symbol } = token;

              return (
                <div
                  className="confirm-import-token__token-list-item"
                  key={address}
                >
                  <div className="confirm-import-token__token confirm-import-token__data">
                    <Identicon
                      className="confirm-import-token__token-icon"
                      diameter={48}
                      address={address}
                    />
                    <div className="confirm-import-token__name">
                      {getTokenName(name, symbol)}
                    </div>
                  </div>
                  <div className="confirm-import-token__balance">
                    <TokenBalance token={token} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="page-container__footer">
        <footer>
          <Button
            type="secondary"
            large
            className="page-container__footer-button"
            onClick={() => {
              dispatch(clearPendingTokens());
              history.push(IMPORT_TOKEN_ROUTE);
            }}
          >
            {t('back')}
          </Button>
          <Button
            type="primary"
            large
            className="page-container__footer-button"
            onClick={handleAddTokens}
          >
            {t('importTokensCamelCase')}
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmImportToken;
