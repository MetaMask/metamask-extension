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
import ActionableMessage from '../actionable-message';
import ImportToken from '../import-token';
import { useNewMetricEvent } from '../../../hooks/useMetricEvent';
import {
  isHardwareWallet,
  getHardwareWalletType,
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
} from '../../../selectors/selectors';
import { SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/swaps';

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

  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);

  const tokenImportedEvent = useNewMetricEvent({
    event: 'Token Imported',
    sensitiveProperties: {
      symbol: tokenForImport?.symbol,
      address: tokenForImport?.address,
      chain_id: chainId,
      is_hardware_wallet: hardwareWalletUsed,
      hardware_wallet_type: hardwareWalletType,
    },
    category: 'swaps',
  });

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

  const onImportTokenClick = () => {
    tokenImportedEvent();
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

  const importTokenProps = {
    onImportTokenCloseClick,
    onImportTokenClick,
    setIsImportTokenModalOpen,
    tokenForImport,
  };

  return (
    <div
      className={classnames('dropdown-search-list', className)}
      onClick={onClickSelector}
      onKeyUp={onKeyUp}
      tabIndex="0"
    >
      {tokenForImport && isImportTokenModalOpen && (
        <ImportToken {...importTokenProps} />
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
                      'dropdown-search-list__select-default': !selectedItem?.symbol,
                    },
                  )}
                >
                  {selectedItem?.symbol || selectPlaceHolderText}
                </span>
              </div>
            </div>
          </div>
          <i className="fa fa-caret-down fa-lg dropdown-search-list__caret" />
        </div>
      )}
      {isOpen && (
        <>
          <SearchableItemList
            itemsToSearch={loading ? [] : itemsToSearch}
            Placeholder={({ searchQuery }) =>
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
                            key="dropdown-search-list__etherscan-link"
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
                </div>
              )
            }
            searchPlaceholderText={t('swapSearchForAToken')}
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
          />
          <div
            className="dropdown-search-list__close-area"
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
