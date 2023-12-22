import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import { useSelector } from 'react-redux';
import {
  Box,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  TextFieldSearch,
} from '../../component-library';
import Button from '../../ui/button';

import {
  BlockSize,
  Display,
  FlexDirection,
  Size,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getFavourites } from '../../../selectors';
import { openFavourite, deleteFavourite } from '../../../store/actions';
import FavouriteItem from './favourite-item';

const Favourites = ({ onClose, showFavouriteNumbers }) => {
  const t = useI18nContext();

  const _favourites = useSelector(getFavourites);
  const favourites = Object.values(_favourites);

  const [searchQuery, setSearchQuery] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);

  let searchResults = favourites;
  if (searchQuery) {
    const fuse = new Fuse(favourites, {
      threshold: 0.2,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ['origin'],
    });
    fuse.setCollection(favourites);
    searchResults = fuse.search(searchQuery);
  }

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        className="multichain-account-menu-popover"
        modalDialogProps={{
          className: 'favourites__dialog',
          padding: 0,
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
        }}
      >
        <ModalHeader padding={4} onClose={onClose} onBack={onClose}>
          Favourites
        </ModalHeader>

        <>
          {/* Search box */}
          {favourites.length > 1 ? (
            <Box
              paddingLeft={4}
              paddingRight={4}
              paddingBottom={4}
              paddingTop={0}
            >
              <TextFieldSearch
                size={Size.SM}
                width={BlockSize.Full}
                placeholder="Search Favourites"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                clearButtonOnClick={() => setSearchQuery('')}
                clearButtonProps={{
                  size: Size.SM,
                }}
                inputProps={{ autoFocus: true }}
              />
            </Box>
          ) : null}
          {/* Favourites list block */}
          <Box className="favourites-items__list">
            {searchResults.length === 0 && searchQuery !== '' ? (
              <Text
                paddingLeft={4}
                paddingRight={4}
                color={TextColor.textMuted}
                data-testid="multichain-account-menu-popover-no-results"
              >
                {t('noAccountsFound')}
              </Text>
            ) : null}
            <div className="favourites-grid">
              {searchResults.map((favouriteItem, index) => {
                return (
                  <FavouriteItem
                    {...favouriteItem}
                    onClick={(href) => {
                      if (deleteMode) {
                        deleteFavourite(favouriteItem);
                      } else {
                        openFavourite(href);
                      }
                    }}
                    showFavouriteNumbers={showFavouriteNumbers}
                    num={favouriteItem.number}
                    key={`favourite-item-${index}`}
                    className={deleteMode ? 'favourite-item--delete' : ''}
                    deleteMode={deleteMode}
                  />
                );
              })}
            </div>
          </Box>
          <div className="favourites-delete">
            <Button
              type={deleteMode ? '' : 'danger'}
              onClick={() => setDeleteMode(!deleteMode)}
            >
              {deleteMode ? t('done') : t('delete')}
            </Button>
          </div>
        </>
      </ModalContent>
    </Modal>
  );
};

Favourites.propTypes = {
  favourites: PropTypes.object.isRequired,
  onClose: PropTypes.array.isRequired,
  showFavouriteNumbers: PropTypes.bool,
};

export default Favourites;
