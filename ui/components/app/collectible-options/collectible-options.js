import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import { Menu, MenuItem } from '../../ui/menu';

const CollectibleOptions = ({ onRemove, onViewOnOpensea }) => {
  const t = useContext(I18nContext);
  const [
    collectibleOptionsButtonElement,
    setCollectibleOptionsButtonElement,
  ] = useState(null);
  const [collectibleOptionsOpen, setCollectibleOptionsOpen] = useState(false);

  return (
    <>
      <button
        className="fas fa-ellipsis-v collectible-options__button"
        data-testid="collectible-options__button"
        onClick={() => setCollectibleOptionsOpen(true)}
        ref={setCollectibleOptionsButtonElement}
      />
      {collectibleOptionsOpen ? (
        <Menu
          anchorElement={collectibleOptionsButtonElement}
          onHide={() => setCollectibleOptionsOpen(false)}
        >
          {onViewOnOpensea ? (
            <MenuItem
              iconClassName="fas fa-qrcode"
              data-testid="collectible-options__view-on-opensea"
              onClick={() => {
                setCollectibleOptionsOpen(false);
                onViewOnOpensea();
              }}
            >
              {t('viewOnOpensea')}
            </MenuItem>
          ) : null}
          <MenuItem
            iconClassName="fas fa-trash-alt collectible-options__icon"
            data-testid="collectible-options__hide"
            onClick={() => {
              setCollectibleOptionsOpen(false);
              onRemove();
            }}
          >
            {t('removeNFT')}
          </MenuItem>
        </Menu>
      ) : null}
    </>
  );
};

CollectibleOptions.propTypes = {
  onRemove: PropTypes.func.isRequired,
  onViewOnOpensea: PropTypes.func.isRequired,
};

export default CollectibleOptions;
