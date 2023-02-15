import React, { useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import { Menu, MenuItem } from '../../ui/menu';
import { ButtonIcon, ICON_NAMES } from '../../component-library';
import { Color } from '../../../helpers/constants/design-system';

const CollectibleOptions = ({ onRemove, onViewOnOpensea }) => {
  const t = useContext(I18nContext);
  const [collectibleOptionsOpen, setCollectibleOptionsOpen] = useState(false);
  const ref = useRef(false);

  return (
    <div ref={ref}>
      <ButtonIcon
        iconName={ICON_NAMES.MORE_VERTICAL}
        className="collectible-options__button"
        data-testid="collectible-options__button"
        onClick={() => setCollectibleOptionsOpen(true)}
        color={Color.textDefault}
        ariaLabel={t('nftOptions')}
      />

      {collectibleOptionsOpen ? (
        <Menu
          data-testid="close-collectible-options-menu"
          anchorElement={ref.current}
          onHide={() => setCollectibleOptionsOpen(false)}
        >
          {onViewOnOpensea ? (
            <MenuItem
              iconName={ICON_NAMES.EXPORT}
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
            iconName={ICON_NAMES.TRASH}
            data-testid="collectible-item-remove"
            onClick={() => {
              setCollectibleOptionsOpen(false);
              onRemove();
            }}
          >
            {t('removeNFT')}
          </MenuItem>
        </Menu>
      ) : null}
    </div>
  );
};

CollectibleOptions.propTypes = {
  onRemove: PropTypes.func.isRequired,
  onViewOnOpensea: PropTypes.func,
};

export default CollectibleOptions;
