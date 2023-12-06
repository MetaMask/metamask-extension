import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { Box, ButtonSecondary, IconName, Text } from '../../component-library';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import {
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
} from '../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
///: END:ONLY_INCLUDE_IF
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getCurrentChainId,
  getMetaMetricsId,
  ///: END:ONLY_INCLUDE_IF
  isBalanceCached,
} from '../../../selectors';
import Spinner from '../../ui/spinner';
import {
  AlignItems,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { CURRENCY_SYMBOLS } from '../../../../shared/constants/network';
///: END:ONLY_INCLUDE_IF
import UserPreferencedCurrencyDisplay from '../../app/user-preferenced-currency-display';
import { PRIMARY } from '../../../helpers/constants/common';

export const BalanceOverview = ({ balance, loading }) => {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const metaMetricsId = useSelector(getMetaMetricsId);
  const chainId = useSelector(getCurrentChainId);
  ///: END:ONLY_INCLUDE_IF
  const balanceIsCached = useSelector(isBalanceCached);

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const mmiPortfolioEnabled = useSelector(getMmiPortfolioEnabled);
  const mmiPortfolioUrl = useSelector(getMmiPortfolioUrl);

  const portfolioEvent = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.MMIPortfolioButtonClicked,
    });
  };
  const renderInstitutionalButtons = () => {
    return mmiPortfolioEnabled ? (
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
    ) : null;
  };

  ///: END:ONLY_INCLUDE_IF

  return (
    <Box
      className="token-balance-overview"
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.center}
      padding={4}
    >
      <Box className="token-balance-overview__balance">
        {balance ? (
          <Text
            variant={TextVariant.headingLg}
            color={TextColor.textDefault}
            className={classnames({
              'token-balance-overview__secondary-balance': !balanceIsCached,
            })}
          >
            {loading ? (
              ''
            ) : (
              <UserPreferencedCurrencyDisplay
                ethNumberOfDecimals={4}
                value={balance}
                type={PRIMARY}
                data-testid="token-balance-overview-currency-display"
              />
            )}
          </Text>
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
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        renderInstitutionalButtons()
        ///: END:ONLY_INCLUDE_IF
      }
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        <ButtonSecondary
          className="token-balance-portfolio"
          data-testid="token-balance-portfolio"
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
                token_symbol: CURRENCY_SYMBOLS.ETH,
              },
            });
          }}
        >
          {t('portfolio')}
        </ButtonSecondary>
        ///: END:ONLY_INCLUDE_IF
      }
    </Box>
  );
};

BalanceOverview.propTypes = {
  /**
   * String balance of the account
   */
  balance: PropTypes.string.isRequired,
  /**
   * Represents if the token values are currently loading
   */
  loading: PropTypes.bool.isRequired,
};
