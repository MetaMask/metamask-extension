import React, { useCallback, useState } from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { Popover, PopoverPosition } from '../../../../component-library';
import SortControl from '../sort-control/sort-control';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import Tooltip from '../../../../ui/tooltip';
import {
  controlPopoverStyle,
  useAssetControl,
  useIsControlBarFullScreen,
} from './asset-controls';

/**
 * Sort button and the sort popover. Writes the shared `tokenSortConfig`.
 */
export const SortByButton = () => {
  const t = useI18nContext();
  const isFullScreen = useIsControlBarFullScreen();
  const { isOpen, toggle, close } = useAssetControl('sort');
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const setButtonRef = useCallback((node: HTMLButtonElement | null) => {
    setReferenceElement(node);
  }, []);

  return (
    <>
      <Tooltip
        title={t('sortBy')}
        position="bottom"
        distance={20}
        disabled={isOpen}
      >
        <ButtonIcon
          ref={setButtonRef}
          data-testid="sort-by-popover-toggle"
          className={`${'flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent hover:bg-hover active:bg-pressed'} ${
            isOpen ? 'bg-pressed' : 'bg-transparent'
          }`}
          onClick={toggle}
          size={ButtonIconSize.Sm}
          iconName={IconName.ListArrow}
          ariaLabel={t('sortBy')}
        />
      </Tooltip>
      <Popover
        onClickOutside={close}
        isOpen={isOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={referenceElement}
        matchWidth={false}
        style={controlPopoverStyle(isFullScreen, '250px')}
      >
        <SortControl handleClose={close} />
      </Popover>
    </>
  );
};
