import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Identicon from '../../../../components/ui/identicon';
import UrlIcon from '../../../../components/ui/url-icon';
import Button from '../../../../components/ui/button';
import ActionableMessage from '../../../../components/ui/actionable-message/actionable-message';
import { I18nContext } from '../../../../contexts/i18n';
import { getCurrentChainId } from '../../../../../shared/modules/selectors/networks';
import {
  getRpcPrefsForCurrentProvider,
  getUseCurrencyRateCheck,
} from '../../../../selectors';
import { MetaMetricsEventCategory } from '../../../../../shared/constants/metametrics';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../../shared/constants/common';
import { getURLHostName } from '../../../../helpers/utils/util';
import { MetaMetricsContext } from '../../../../contexts/metametrics';

export default function ItemList({
  results = [],
  onClickItem,
  onOpenImportTokenModalClick,
  Placeholder,
  listTitle,
  maxListItems = 6,
  searchQuery = '',
  containerRef,
  hideRightLabels,
  hideItemIf,
  listContainerClassName,
}) {
  const t = useContext(I18nContext);
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const blockExplorerLink =
    rpcPrefs.blockExplorerUrl ??
    CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[chainId] ??
    null;
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const blockExplorerHostName = getURLHostName(blockExplorerLink);
  const trackEvent = useContext(MetaMetricsContext);

  // If there is a token for import based on a contract address, it's the only one in the list.
  const hasTokenForImport = results.length === 1 && results[0].notImported;
  const placeholder = Placeholder ? (
    <Placeholder searchQuery={searchQuery} />
  ) : null;
  return results.length === 0 ? (
    placeholder
  ) : (
    <div className="searchable-item-list">
      {listTitle ? (
        <div className="searchable-item-list__title">{listTitle}</div>
      ) : null}
      <div
        className={classnames(
          'searchable-item-list__list-container',
          listContainerClassName,
        )}
        ref={containerRef}
        data-testid="searchable-item-list-list-container"
      >
        {results.slice(0, maxListItems).map((result, i) => {
          if (hideItemIf?.(result)) {
            return null;
          }
          const hasBalance = result.balance > 0;
          if (result.blocked && !hasBalance && !searchQuery) {
            return null;
          }

          const onClick = () => {
            if (result.blocked) {
              return;
            }
            if (result.notImported) {
              onOpenImportTokenModalClick(result);
            } else {
              onClickItem?.(result);
            }
          };
          const {
            iconUrl,
            identiconAddress,
            selected,
            blocked,
            primaryLabel,
            secondaryLabel,
            rightPrimaryLabel,
            rightSecondaryLabel,
            IconComponent,
          } = result;
          return (
            <div
              tabIndex="0"
              className={classnames('searchable-item-list__item', {
                'searchable-item-list__item--selected': selected,
                'searchable-item-list__item--disabled': blocked,
              })}
              data-testid="searchable-item-list__item"
              onClick={onClick}
              onKeyUp={(e) => e.key === 'Enter' && onClick()}
              key={`searchable-item-list-item-${i}`}
              title={blocked ? t('swapTokenNotAvailable') : null}
            >
              {iconUrl || primaryLabel ? (
                <UrlIcon url={iconUrl} name={primaryLabel} />
              ) : null}
              {!(iconUrl || primaryLabel) && identiconAddress ? (
                <div className="searchable-item-list__identicon">
                  <Identicon address={identiconAddress} diameter={24} />
                </div>
              ) : null}
              {IconComponent ? <IconComponent /> : null}
              <div className="searchable-item-list__labels">
                <div className="searchable-item-list__item-labels">
                  {primaryLabel ? (
                    <span
                      className="searchable-item-list__primary-label"
                      data-testid="searchable-item-list-primary-label"
                    >
                      {primaryLabel}
                    </span>
                  ) : null}
                  {secondaryLabel ? (
                    <span className="searchable-item-list__secondary-label">
                      {secondaryLabel}
                    </span>
                  ) : null}
                </div>
                {!hideRightLabels &&
                (rightPrimaryLabel || rightSecondaryLabel) ? (
                  <div className="searchable-item-list__right-labels">
                    {rightPrimaryLabel ? (
                      <span className="searchable-item-list__right-primary-label">
                        {rightPrimaryLabel}
                      </span>
                    ) : null}
                    {rightSecondaryLabel && useCurrencyRateCheck ? (
                      <span className="searchable-item-list__right-secondary-label">
                        {rightSecondaryLabel}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {result.notImported && (
                <Button
                  type="primary"
                  onClick={onClick}
                  data-testid="searchable-item-list-import-button"
                >
                  {t('import')}
                </Button>
              )}
            </div>
          );
        })}
        {!hasTokenForImport && blockExplorerLink && (
          <div
            tabIndex="0"
            className="searchable-item-list__item searchable-item-list__item--add-token"
            key="searchable-item-list-item-last"
          >
            <ActionableMessage
              message={t('addTokenByContractAddress', [
                <a
                  key="searchable-item-list__etherscan-link"
                  onClick={() => {
                    /* istanbul ignore next */
                    trackEvent({
                      event: 'Clicked Block Explorer Link',
                      category: MetaMetricsEventCategory.Swaps,
                      properties: {
                        link_type: 'Token Tracker',
                        action: 'Verify Contract Address',
                        block_explorer_domain: blockExplorerHostName,
                      },
                    });
                    global.platform.openTab({
                      url: blockExplorerLink,
                    });
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {blockExplorerHostName}
                </a>,
              ])}
            />
          </div>
        )}
      </div>
    </div>
  );
}

ItemList.propTypes = {
  results: PropTypes.arrayOf(
    PropTypes.shape({
      iconUrl: PropTypes.string,
      selected: PropTypes.bool,
      blocked: PropTypes.bool,
      primaryLabel: PropTypes.string,
      secondaryLabel: PropTypes.string,
      rightPrimaryLabel: PropTypes.string,
      rightSecondaryLabel: PropTypes.string,
    }),
  ),
  onClickItem: PropTypes.func,
  onOpenImportTokenModalClick: PropTypes.func,
  Placeholder: PropTypes.func,
  listTitle: PropTypes.string,
  maxListItems: PropTypes.number,
  searchQuery: PropTypes.string,
  containerRef: PropTypes.shape({
    current: PropTypes.instanceOf(window.Element),
  }),
  hideRightLabels: PropTypes.bool,
  hideItemIf: PropTypes.func,
  listContainerClassName: PropTypes.string,
};
