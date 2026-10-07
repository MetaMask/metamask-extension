import React, { useCallback, useContext, useState } from 'react';
import { I18nContext } from '../../../../../contexts/i18n';
import { Box } from '../../../../component-library/box/box';
import { ButtonIcon } from '../../../../component-library/button-icon/button-icon';
import { ButtonIconSize } from '../../../../component-library/button-icon/button-icon.types';
import { Icon } from '../../../../component-library/icon/icon';
import {
  IconName,
  IconSize,
} from '../../../../component-library/icon/icon.types';
import { Popover } from '../../../../component-library/popover/popover';
import { PopoverPosition } from '../../../../component-library/popover/popover.types';
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
        onClickOutside={closePopover}
        isOpen={nftOptionsOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={referenceElement}
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
