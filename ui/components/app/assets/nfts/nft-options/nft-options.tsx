import React, { useCallback, useContext, useState } from 'react';
import {
  Popover,
  PopoverPosition,
  PopoverRole,
} from '@metamask/design-system-react';
import { I18nContext } from '../../../../../contexts/i18n';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
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
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null,
  );

  const setAnchorRef = useCallback((node: HTMLElement | null) => {
    setReferenceElement(node);
  }, []);

  const closePopover = () => {
    setNftOptionsOpen(false);
  };

  return (
    <Box ref={setAnchorRef}>
      <ButtonIcon
        iconName={IconName.MoreVertical}
        data-testid="nft-options__button"
        onClick={() => setNftOptionsOpen(!nftOptionsOpen)}
        color={IconColor.iconDefault}
        size={ButtonIconSize.Md}
        ariaLabel={t('nftOptions')}
      />
      <Popover
        onClose={closePopover}
        isOpen={nftOptionsOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={referenceElement}
        role={PopoverRole.Dialog}
        className="p-0"
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
