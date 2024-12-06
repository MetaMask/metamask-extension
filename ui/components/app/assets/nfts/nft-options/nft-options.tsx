import React, { useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../../../contexts/i18n';
import { Menu, MenuItem } from '../../../../ui/menu';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../../component-library';
import { IconColor } from '../../../../../helpers/constants/design-system';

type NftOptionsProps = {
  onRemove: () => void;
  onViewOnOpensea?: () => void;
};

const NftOptions = ({ onRemove, onViewOnOpensea }: NftOptionsProps) => {
  const t = useContext(I18nContext);
  const [nftOptionsOpen, setNftOptionsOpen] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  return (
    <Box ref={ref}>
      <ButtonIcon
        iconName={IconName.MoreVertical}
        data-testid="nft-options__button"
        onClick={() => setNftOptionsOpen(true)}
        color={IconColor.iconDefault}
        size={ButtonIconSize.Sm}
        ariaLabel={t('nftOptions')}
      />

      {nftOptionsOpen ? (
        // TODO: Menu is deprecated, use Popover instead
        <Menu
          data-testid="close-nft-options-menu"
          anchorElement={ref.current}
          onHide={() => setNftOptionsOpen(false)}
        >
          {onViewOnOpensea ? (
            // @ts-ignore: need to update deprecated menu to popover
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
          {/* @ts-ignore: need to update deprecated menu to popover */}
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
    </Box>
  );
};

NftOptions.propTypes = {
  onRemove: PropTypes.func.isRequired,
  onViewOnOpensea: PropTypes.func,
};

export default NftOptions;
