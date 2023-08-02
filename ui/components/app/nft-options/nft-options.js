import React, { useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import { Menu, MenuItem } from '../../ui/menu';
import { ButtonIcon, ButtonIconSize, IconName } from '../../component-library';
import { Color } from '../../../helpers/constants/design-system';

const NftOptions = ({ onRemove, onViewOnOpensea }) => {
  const t = useContext(I18nContext);
  const [nftOptionsOpen, setNftOptionsOpen] = useState(false);
  const ref = useRef(false);

  return (
    <div ref={ref}>
      <ButtonIcon
        iconName={IconName.MoreVertical}
        className="nft-options__button"
        data-testid="nft-options__button"
        onClick={() => setNftOptionsOpen(true)}
        color={Color.textDefault}
        size={ButtonIconSize.Sm}
        ariaLabel={t('nftOptions')}
      />

      {nftOptionsOpen ? (
        <Menu
          data-testid="close-nft-options-menu"
          anchorElement={ref.current}
          onHide={() => setNftOptionsOpen(false)}
        >
          {onViewOnOpensea ? (
            <MenuItem
              iconName={IconName.Export}
              data-testid="nft-options__view-on-opensea"
              onClick={() => {
                setNftOptionsOpen(false);
                onViewOnOpensea();
              }}
            >
              {t('viewOnOpensea')}
            </MenuItem>
          ) : null}
          <MenuItem
            iconName={IconName.Trash}
            data-testid="nft-item-remove"
            onClick={() => {
              setNftOptionsOpen(false);
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

NftOptions.propTypes = {
  onRemove: PropTypes.func.isRequired,
  onViewOnOpensea: PropTypes.func,
};

export default NftOptions;
