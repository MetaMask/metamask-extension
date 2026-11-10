import React from 'react';
import { Popover } from '../../../../component-library';
import { OptionsButton } from './options-button';
import { useControlPopover } from './use-control-popover';

const OPTIONS_MENU_MIN_WIDTH = '158px';

type OptionsMenuProps = {
  children: React.ReactNode;
};

/**
 * More button and its popover.
 *
 * @param props - The component props.
 * @param props.children - The menu items.
 */
export const OptionsMenu = ({ children }: OptionsMenuProps) => {
  const { buttonRef, toggle, popoverProps } = useControlPopover(
    OPTIONS_MENU_MIN_WIDTH,
  );

  return (
    <>
      <OptionsButton ref={buttonRef} onClick={toggle} />
      <Popover {...popoverProps}>{children}</Popover>
    </>
  );
};
