import React, {
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
} from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { isEqual } from 'lodash';
import { I18nContext } from '../../../contexts/i18n';
import SearchableItemList from '../searchable-item-list';
import PulseLoader from '../../../components/ui/pulse-loader';
import UrlIcon from '../../../components/ui/url-icon';
import {
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import ActionableMessage from '../../../components/ui/actionable-message/actionable-message';
import ImportToken from '../import-token';
import {
  isHardwareWallet,
  getHardwareWalletType,
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
} from '../../../selectors/selectors';
import { SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/swaps';
import { getURLHostName } from '../../../helpers/utils/util';
import {
  getSmartTransactionsOptInStatus,
  getSmartTransactionsEnabled,
  getCurrentSmartTransactionsEnabled,
} from '../../../ducks/swaps/swaps';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';

export default function DropdownSearchList({
  searchListClassName,
  itemsToSearch,
  selectPlaceHolderText,
  fuseSearchKeys,
  defaultToAll,
  maxListItems,
  onSelect,
  startingItem,
  onOpen,
  onClose,
  className = '',
  externallySelectedItem,
  selectorClosedClassName,
  loading,
  hideRightLabels,
  hideItemIf,
  listContainerClassName,
  shouldSearchForImports,
}) {
  const t = useContext(I18nContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isImportTokenModalOpen, setIsImportTokenModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(startingItem);
  const [tokenForImport, setTokenForImport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const smartTransactionsOptInStatus = useSelector(
    getSmartTransactionsOptInStatus,
  );
  const smartTransactionsEnabled = useSelector(getSmartTransactionsEnabled);
  const currentSmartTransactionsEnabled = useSelector(
    getCurrentSmartTransactionsEnabled,
  );

  const trackEvent = useContext(MetaMetricsContext);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const onClickItem = useCallback(
    (item) => {
      onSelect?.(item);
      setSelectedItem(item);
      close();
    },
    [onSelect, close],
  );

  const onOpenImportTokenModalClick = (item) => {
    setTokenForImport(item);
    setIsImportTokenModalOpen(true);
  };

  /* istanbul ignore next */
  const onImportTokenClick = () => {
    trackEvent({
      event: 'Token Imported',
      category: MetaMetricsEventCategory.Swaps,
      sensitiveProperties: {
        symbol: tokenForImport?.symbol,
        address: tokenForImport?.address,
        chain_id: chainId,
        is_hardware_wallet: hardwareWalletUsed,
        hardware_wallet_type: hardwareWalletType,
        stx_enabled: smartTransactionsEnabled,
        current_stx_enabled: currentSmartTransactionsEnabled,
        stx_user_opt_in: smartTransactionsOptInStatus,
      },
    });
    // Only when a user confirms import of a token, we add it and show it in a dropdown.
    onSelect?.(tokenForImport);
    setSelectedItem(tokenForImport);
    setTokenForImport(null);
    close();
  };

  const onImportTokenCloseClick = () => {
    setIsImportTokenModalOpen(false);
    close();
  };

  const onClickSelector = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true);
      onOpen?.();
    }
  }, [isOpen, onOpen]);

  const prevExternallySelectedItemRef = useRef();
  useEffect(() => {
    prevExternallySelectedItemRef.current = externallySelectedItem;
  });
  const prevExternallySelectedItem = prevExternallySelectedItemRef.current;

  useEffect(() => {
    if (
      externallySelectedItem &&
      !isEqual(externallySelectedItem, selectedItem)
    ) {
      setSelectedItem(externallySelectedItem);
    } else if (prevExternallySelectedItem && !externallySelectedItem) {
      setSelectedItem(null);
    }
  }, [externallySelectedItem, selectedItem, prevExternallySelectedItem]);

  const onKeyUp = (e) => {
    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'Enter') {
      onClickSelector(e);
    }
  };

  const blockExplorerLink =
    rpcPrefs.blockExplorerUrl ??
    SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[chainId] ??
    null;

  const blockExplorerHostName = getURLHostName(blockExplorerLink);

  const importTokenProps = {
    onImportTokenCloseClick,
    onImportTokenClick,
    setIsImportTokenModalOpen,
    tokenForImport,
  };

  return (
    <div
      className={classnames('dropdown-search-list', className)}
      data-testid="dropdown-search-list"
      onClick={onClickSelector}
      onKeyUp={onKeyUp}
      tabIndex="0"
    >
      {tokenForImport && isImportTokenModalOpen && (
        <ImportToken isOpen {...importTokenProps} />
      )}
      {!isOpen && (
        <div
          className={classnames(
            'dropdown-search-list__selector-closed-container',
            selectorClosedClassName,
          )}
        >
          <div className="dropdown-search-list__selector-closed">
            {selectedItem?.iconUrl && (
              <UrlIcon
                url={selectedItem.iconUrl}
                className="dropdown-search-list__selector-closed-icon"
                name={selectedItem?.symbol}
              />
            )}
            {!selectedItem?.iconUrl && (
              <div className="dropdown-search-list__default-dropdown-icon" />
            )}
            <div className="dropdown-search-list__labels">
              <div className="dropdown-search-list__item-labels">
                <span
                  className={classnames(
                    'dropdown-search-list__closed-primary-label',
                    {
                      'dropdown-search-list__select-default':
                        !selectedItem?.symbol,
                    },
                  )}
                >
                  {selectedItem?.symbol || selectPlaceHolderText}
                </span>
              </div>
            </div>
          </div>
          <Icon name={IconName.ArrowDown} size={IconSize.Xs} marginRight={3} />
        </div>
      )}
      {isOpen && (
        <>
          <SearchableItemList
            itemsToSearch={loading ? [] : itemsToSearch}
            Placeholder={() =>
              /* istanbul ignore next */
              loading ? (
                <div className="dropdown-search-list__loading-item">
                  <PulseLoader />
                  <div className="dropdown-search-list__loading-item-text-container">
                    <span className="dropdown-search-list__loading-item-text">
                      {t('swapFetchingTokens')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="dropdown-search-list__placeholder">
                  {t('swapBuildQuotePlaceHolderText', [searchQuery])}
                  {blockExplorerLink && (
                    <div
                      tabIndex="0"
                      className="searchable-item-list__item searchable-item-list__item--add-token"
                      key="searchable-item-list-item-last"
                    >
                      <ActionableMessage
                        message={t('addTokenByContractAddress', [
                          <a
                            key="dropdown-search-list__etherscan-link"
                            onClick={() => {
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
              )
            }
            searchPlaceholderText={t('swapSearchNameOrAddress')}
            fuseSearchKeys={fuseSearchKeys}
            defaultToAll={defaultToAll}
            onClickItem={onClickItem}
            onOpenImportTokenModalClick={onOpenImportTokenModalClick}
            maxListItems={maxListItems}
            className={classnames(
              'dropdown-search-list__token-container',
              searchListClassName,
              {
                'dropdown-search-list--open': isOpen,
              },
            )}
            hideRightLabels={hideRightLabels}
            hideItemIf={hideItemIf}
            listContainerClassName={listContainerClassName}
            shouldSearchForImports={shouldSearchForImports}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          <div
            className="dropdown-search-list__close-area"
            data-testid="dropdown-search-list__close-area"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen(false);
              onClose?.();
            }}
          />
        </>
      )}
    </div>
  );
}

DropdownSearchList.propTypes = {
  itemsToSearch: PropTypes.array,
  onSelect: PropTypes.func,
  searchListClassName: PropTypes.string,
  fuseSearchKeys: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      weight: PropTypes.number,
    }),
  ),
  defaultToAll: PropTypes.bool,
  maxListItems: PropTypes.number,
  startingItem: PropTypes.object,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  className: PropTypes.string,
  externallySelectedItem: PropTypes.object,
  loading: PropTypes.bool,
  selectPlaceHolderText: PropTypes.string,
  selectorClosedClassName: PropTypes.string,
  hideRightLabels: PropTypes.bool,
  hideItemIf: PropTypes.func,
  listContainerClassName: PropTypes.string,
  shouldSearchForImports: PropTypes.bool,
};
