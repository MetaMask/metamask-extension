import React, { useEffect, useRef } from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';

type Props = {
  onDisable: () => void;
};

const menuId = 'mm-cashtag-more-menu';
const menuAnchor = '--cashtag-menu-anchor';

const BanIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.2 14.8L14.8 5.2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export function MoreMenu({ onDisable }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) {
      return;
    }
    trigger.setAttribute('popovertarget', menuId);
    trigger.setAttribute('popovertargetaction', 'toggle');
    trigger.style.setProperty('anchor-name', menuAnchor);
    menu.setAttribute('popover', 'auto');
    menu.style.setProperty('position-anchor', menuAnchor);
  }, []);

  return (
    <div className="inline-flex items-center">
      <ButtonIcon
        ref={triggerRef}
        iconName={IconName.MoreVertical}
        size={ButtonIconSize.Md}
        ariaLabel="More options"
        className="text-icon-alternative hover:bg-muted-hover hover:text-icon-default"
      />
      <div
        ref={menuRef}
        id={menuId}
        className="mm-cashtag-menu min-w-[255px] rounded-xl border border-muted bg-default px-0 py-2 font-sans text-default shadow-sm"
      >
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-4 py-4 text-left text-s-body-md font-medium text-default hover:bg-muted-hover"
          onClick={() => {
            menuRef.current?.hidePopover?.();
            onDisable();
          }}
        >
          <BanIcon />
          <span>Disable this feature</span>
        </button>
      </div>
    </div>
  );
}
