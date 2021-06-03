import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Identicon from '../../../../components/ui/identicon';
import UrlIcon from '../../../../components/ui/url-icon';
import Button from '../../../../components/ui/button';
import ActionableMessage from '../../actionable-message';
import { I18nContext } from '../../../../contexts/i18n';
import {
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
} from '../../../../selectors';
import { SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../../shared/constants/swaps';
import { useNewMetricEvent } from '../../../../hooks/useMetricEvent';

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
    SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[chainId] ??
    null;

  const blockExplorerLabel = rpcPrefs.blockExplorerUrl
    ? new URL(blockExplorerLink).hostname
    : t('etherscan');

  const blockExplorerLinkClickedEvent = useNewMetricEvent({
    category: 'Swaps',
    event: 'Clicked Block Explorer Link',
    properties: {
      link_type: 'Token Tracker',
      action: 'Verify Contract Address',
      block_explorer_domain: blockExplorerLink
        ? new URL(blockExplorerLink)?.hostname
        : '',
    },
  });

  // If there is a token for import based on a contract address, it's the only one in the list.
  const hasTokenForImport = results.length === 1 && results[0].notImported;
  return results.length === 0 ? (
    Placeholder && <Placeholder searchQuery={searchQuery} />
  ) : (
    <div className="searchable-item-list">
      {listTitle && (
        <div className="searchable-item-list__title">{listTitle}</div>
      )}
      <div
        className={classnames(
          'searchable-item-list__list-container',
          listContainerClassName,
        )}
        ref={containerRef}
      >
        {results.slice(0, maxListItems).map((result, i) => {
          if (hideItemIf?.(result)) {
            return null;
          }

          const onClick = () => {
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
            disabled,
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
                'searchable-item-list__item--disabled': disabled,
              })}
              onClick={onClick}
              onKeyUp={(e) => e.key === 'Enter' && onClick()}
              key={`searchable-item-list-item-${i}`}
            >
              {(iconUrl || primaryLabel) && (
                <UrlIcon url={iconUrl} name={primaryLabel} />
              )}
              {!(iconUrl || primaryLabel) && identiconAddress && (
                <div className="searchable-item-list__identicon">
                  <Identicon address={identiconAddress} diameter={24} />
                </div>
              )}
              {IconComponent && <IconComponent />}
              <div className="searchable-item-list__labels">
                <div className="searchable-item-list__item-labels">
                  {primaryLabel && (
                    <span className="searchable-item-list__primary-label">
                      {primaryLabel}
                    </span>
                  )}
                  {secondaryLabel && (
                    <span className="searchable-item-list__secondary-label">
                      {secondaryLabel}
                    </span>
                  )}
                </div>
                {!hideRightLabels &&
                  (rightPrimaryLabel || rightSecondaryLabel) && (
                    <div className="searchable-item-list__right-labels">
                      {rightPrimaryLabel && (
                        <span className="searchable-item-list__right-primary-label">
                          {rightPrimaryLabel}
                        </span>
                      )}
                      {rightSecondaryLabel && (
                        <span className="searchable-item-list__right-secondary-label">
                          {rightSecondaryLabel}
                        </span>
                      )}
                    </div>
                  )}
              </div>
              {result.notImported && (
                <Button type="confirm" onClick={onClick} rounded>
                  {t('import')}
                </Button>
              )}
            </div>
          );
        })}
        {!hasTokenForImport && (
          <div
            tabIndex="0"
            className="searchable-item-list__item searchable-item-list__item--add-token"
            key="searchable-item-list-item-last"
          >
            <ActionableMessage
              message={
                blockExplorerLink &&
                t('addCustomTokenByContractAddress', [
                  <a
                    key="searchable-item-list__etherscan-link"
                    onClick={() => {
                      blockExplorerLinkClickedEvent();
                      global.platform.openTab({
                        url: blockExplorerLink,
                      });
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {blockExplorerLabel}
                  </a>,
                ])
              }
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
      disabled: PropTypes.bool,
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
