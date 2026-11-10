import React, { useCallback, useState } from 'react';
import { Icon, IconName, IconSize } from '@metamask/design-system-react';
import { Popover, PopoverPosition } from '../../../../component-library';
import { SelectableListItem } from '../sort-control/sort-control';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { OptionsButton } from './options-button';
import {
  controlPopoverStyle,
  useAssetControl,
  useIsControlBarFullScreen,
} from './asset-controls';

type DeFiOptionsMenuProps = {
  onRefresh: () => void;
};

/**
 * DeFi tab options menu. Its only action refreshes the position list.
 *
 * @param props - The component props.
 * @param props.onRefresh - Called when Refresh list is chosen.
 */
export const DeFiOptionsMenu = ({ onRefresh }: DeFiOptionsMenuProps) => {
  const t = useI18nContext();
  const isFullScreen = useIsControlBarFullScreen();
  const { isOpen, toggle, close } = useAssetControl('defi');
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const setButtonRef = useCallback((node: HTMLButtonElement | null) => {
    setReferenceElement(node);
  }, []);

  const handleRefresh = () => {
    onRefresh();
    close();
  };

  return (
    <>
      <OptionsButton ref={setButtonRef} showTokensLinks onClick={toggle} />
      <Popover
        onClickOutside={close}
        isOpen={isOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={referenceElement}
        matchWidth={false}
        style={controlPopoverStyle(isFullScreen, '158px')}
      >
        <SelectableListItem onClick={handleRefresh} testId="refreshList">
          <Icon name={IconName.Refresh} size={IconSize.Sm} className="mr-2" />
          {t('refreshList')}
        </SelectableListItem>
      </Popover>
    </>
  );
};
