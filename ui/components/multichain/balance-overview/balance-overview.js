import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { Box, ButtonSecondary, IconName } from '../../component-library';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import {
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
} from '../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IN
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import {
  getCurrentChainId,
  getMetaMetricsId,
  getSelectedAccountCachedBalance,
  getShouldShowFiat,
  isBalanceCached,
} from '../../../selectors';
import Spinner from '../../ui/spinner';
import UserPreferencedCurrencyDisplay from '../../app/user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';

export const BalanceOverview = () => {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const metaMetricsId = useSelector(getMetaMetricsId);
  const chainId = useSelector(getCurrentChainId);
  const balanceIsCached = useSelector(isBalanceCached);
  const balance = useSelector(getSelectedAccountCachedBalance);
  const showFiat = useSelector(getShouldShowFiat);

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const mmiPortfolioEnabled = useSelector(getMmiPortfolioEnabled);
  const mmiPortfolioUrl = useSelector(getMmiPortfolioUrl);

  const portfolioEvent = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.MMIPortfolioButtonClicked,
    });
  };
  const renderInstitutionalButtons = () => {
    return (
      mmiPortfolioEnabled && (
        <ButtonSecondary
          className="token-balance-mmi-portfolio"
          onClick={() => {
            portfolioEvent();
            window.open(mmiPortfolioUrl, '_blank');
          }}
          endIconName={IconName.Export}
        >
          {t('portfolio')}
        </ButtonSecondary>
      )
    );
  };

  ///: END:ONLY_INCLUDE_IN
  return (
    <Box
      className="token-balance-overview"
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.center}
      padding={4}
    >
      <Box className="token-balance-overview__balance">
        <Box className="token-balance-overview__primary-container">
          {balance ? (
            <UserPreferencedCurrencyDisplay
              style={{ display: 'contents' }}
              className={classnames('token-balance-overview__primary-balance', {
                'token-balance-overview__cached-balance': balanceIsCached,
              })}
              data-testid="token-balance-overview__primary-currency"
              value={balance}
              type={PRIMARY}
              ethNumberOfDecimals={4}
              hideTitle
            />
          ) : (
            <Spinner
              color="var(--color-secondary-default)"
              className="loading-overlay__spinner"
            />
          )}
          {balanceIsCached ? (
            <span className="token-balance-overview__cached-star">*</span>
          ) : null}
        </Box>
        {showFiat && balance && (
          <UserPreferencedCurrencyDisplay
            className={classnames({
              'token-balance-overview__cached-secondary-balance':
                balanceIsCached,
              'token-balance-overview__secondary-balance': !balanceIsCached,
            })}
            data-testid="token-balance-overview__secondary-currency"
            value={balance}
            type={SECONDARY}
            ethNumberOfDecimals={4}
          />
        )}
      </Box>
      {
        ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
        renderInstitutionalButtons()
        ///: END:ONLY_INCLUDE_IN
      }
      {
        ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
        <ButtonSecondary
          className="token-balance-portfolio"
          endIconName={IconName.Export}
          onClick={() => {
            const url = getPortfolioUrl(
              '',
              'ext_portfolio_button',
              metaMetricsId,
            );
            global.platform.openTab({ url });
            trackEvent({
              category: MetaMetricsEventCategory.Navigation,
              event: MetaMetricsEventName.PortfolioLinkClicked,
              properties: {
                location: 'Home',
                text: 'Portfolio',
                chain_id: chainId,
                token_symbol: 'ETH',
              },
            });
          }}
        >
          {t('portfolio')}
        </ButtonSecondary>
        ///: END:ONLY_INCLUDE_IN
      }
    </Box>
  );
};
