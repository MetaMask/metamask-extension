import React, { useContext, useRef, useState } from 'react';
import { I18nContext } from '../../../../../contexts/i18n';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Popover,
  PopoverPosition,
} from '../../../../component-library';
import { IconColor } from '../../../../../helpers/constants/design-system';
import { SelectableListItem } from '../../asset-list/sort-control/sort-control';

type NftOptionsProps = {
  onRemove: () => void;
  onViewOnOpensea?: () => void;
  showOpenSeaLink: boolean;
};

const NftOptions = ({
  onRemove,
  onViewOnOpensea,
  showOpenSeaLink,
}: NftOptionsProps) => {
  const t = useContext(I18nContext);
  const [nftOptionsOpen, setNftOptionsOpen] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  const closePopover = () => {
    setNftOptionsOpen(false);
  };

  return (
    <Box ref={ref}>
      <ButtonIcon
        iconName={IconName.MoreVertical}
        data-testid="nft-options__button"
        onClick={() => setNftOptionsOpen(!nftOptionsOpen)}
        color={IconColor.iconDefault}
        size={ButtonIconSize.Sm}
        ariaLabel={t('nftOptions')}
      />
      <Popover
        onClickOutside={closePopover}
        isOpen={nftOptionsOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={ref.current}
        matchWidth={false}
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
        }}
      >
        {showOpenSeaLink ? (
          <SelectableListItem
            testId="nft-options__view-on-opensea"
            onClick={() => {
              closePopover();
              onViewOnOpensea?.();
            }}
          >
            <Icon
              name={IconName.Export}
              size={IconSize.Sm}
              marginInlineEnd={2}
            />
            {t('viewOnOpensea')}
          </SelectableListItem>
        ) : null}
        <SelectableListItem
          testId="nft-item-remove"
          onClick={() => {
            closePopover();
            onRemove?.();
          }}
        >
          <Icon name={IconName.Trash} size={IconSize.Sm} marginInlineEnd={2} />
          {t('removeNFT')}
        </SelectableListItem>
      </Popover>
    </Box>
  );
};

export default NftOptions;
