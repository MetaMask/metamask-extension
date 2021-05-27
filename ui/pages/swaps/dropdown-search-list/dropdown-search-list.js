import React, {
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { isEqual } from 'lodash';
import { I18nContext } from '../../../contexts/i18n';
import SearchableItemList from '../searchable-item-list';
import PulseLoader from '../../../components/ui/pulse-loader';
import UrlIcon from '../../../components/ui/url-icon';
import Popover from '../../../components/ui/popover';
import Button from '../../../components/ui/button';
import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography';
import ActionableMessage from '../actionable-message';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  ALIGN_ITEMS,
  DISPLAY,
} from '../../../helpers/constants/design-system';

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
}) {
  const t = useContext(I18nContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isImportTokenModalOpen, setIsImportTokenModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(startingItem);
  const [tokenForImport, setTokenForImport] = useState(null);
  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const onClickItem = useCallback(
    (item) => {
      if (item.notImported) {
        // Opens a modal window for importing a token.
        setTokenForImport(item);
        setIsImportTokenModalOpen(true);
        return;
      }
      onSelect?.(item);
      setSelectedItem(item);
      close();
    },
    [onSelect, close],
  );

  const onImportTokenClick = () => {
    // Only when a user confirms import of a token, we add it an show it in a dropdown.
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

  const ImportTokenModalFooter = (
    <>
      <Button
        type="secondary"
        className="page-container__footer-button"
        onClick={onImportTokenCloseClick}
        rounded
      >
        {t('cancel')}
      </Button>
      <Button
        type="confirm"
        className="page-container__footer-button"
        onClick={onImportTokenClick}
        rounded
      >
        {t('import')}
      </Button>
    </>
  );

  return (
    <div
      className={classnames('dropdown-search-list', className)}
      onClick={onClickSelector}
      onKeyUp={onKeyUp}
      tabIndex="0"
    >
      {tokenForImport && isImportTokenModalOpen && (
        <Popover
          title={t('importTokenQuestion')}
          onClose={() => setIsImportTokenModalOpen(false)}
          footer={ImportTokenModalFooter}
        >
          <Box
            padding={[0, 6, 4, 6]}
            alignItems={ALIGN_ITEMS.CENTER}
            display={DISPLAY.FLEX}
            className="dropdown-search-list__import-token"
          >
            <ActionableMessage
              type="danger"
              message={t('importTokenWarning')}
            />
            <UrlIcon
              url={tokenForImport.iconUrl}
              className="dropdown-search-list__token-icon"
              fallbackClassName="dropdown-search-list__token-icon"
              name={tokenForImport.symbol}
            />
            <Typography
              ariant={TYPOGRAPHY.H4}
              fontWeight={FONT_WEIGHT.BOLD}
              boxProps={{ marginTop: 2, marginBottom: 3 }}
            >
              {tokenForImport.name}
            </Typography>
            <Typography variant={TYPOGRAPHY.H6}>{t('contract')}:</Typography>
            <Typography
              className="dropdown-search-list__contract-address"
              variant={TYPOGRAPHY.H7}
              boxProps={{ marginBottom: 6 }}
            >
              {tokenForImport.address}
            </Typography>
          </Box>
        </Popover>
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
                      message={t('addCustomTokenByContractAddress')}
                    />
                  </div>
                </div>
              )
            }
            searchPlaceholderText={t('swapSearchForAToken')}
            fuseSearchKeys={fuseSearchKeys}
            defaultToAll={defaultToAll}
            onClickItem={onClickItem}
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
};
