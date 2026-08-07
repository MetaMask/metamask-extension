import React, { useEffect, useRef } from 'react';

type MoreMenuProps = {
  onDisable: () => void;
  onFlag: () => void;
};

const menuId = 'mm-cashtag-more-menu';
const menuAnchor = '--cashtag-menu-anchor';

function BanIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.2 14.8L14.8 5.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 3.5v13M5 4.5h8.5l-1.5 3.5 1.5 3.5H5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="4.5" r="1.4" fill="currentColor" />
      <circle cx="10" cy="10" r="1.4" fill="currentColor" />
      <circle cx="10" cy="15.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function MoreMenu({ onDisable, onFlag }: MoreMenuProps) {
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
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 text-icon-alternative hover:bg-muted-hover hover:text-icon-default"
        aria-label="More options"
      >
        <MoreIcon />
      </button>
      <div
        ref={menuRef}
        id={menuId}
        className="mm-cashtag-menu dark min-w-[255px] animate-mm-cashtag-fade-in rounded-xl border border-muted bg-default py-2 font-sans text-default shadow-sm"
        data-theme="dark"
      >
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-4 py-4 text-left text-s-body-md font-medium text-default hover:bg-muted-hover"
          onClick={onDisable}
        >
          <BanIcon />
          <span>Disable this feature</span>
        </button>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-4 py-4 text-left text-s-body-md font-medium text-default hover:bg-muted-hover"
          onClick={onFlag}
        >
          <FlagIcon />
          <span>Flag this token as unsafe</span>
        </button>
      </div>
    </div>
  );
}
