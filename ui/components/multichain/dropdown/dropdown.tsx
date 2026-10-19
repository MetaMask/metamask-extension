import React, { useEffect, useRef } from 'react';
import { Box } from '@metamask/design-system-react';

export const DROPDOWN_OPTION_SELECTOR = '[data-dropdown-option]';

export const dropdownOptionProps = {
  'data-dropdown-option': '',
} as const;

/**
 * Suggestion list that matches a search dropdown: Tab moves through the rows,
 * and the arrow keys do too. Enter activates whichever row is focused.
 * @param options0
 * @param options0.children
 */
export const Dropdown = ({
  children,
  ...props
}: React.ComponentProps<typeof Box>) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
        return;
      }

      const dropdown = dropdownRef.current;
      const anchor =
        dropdown?.closest('[data-dropdown-root]') ??
        dropdown?.closest('.relative') ??
        dropdown;
      const { activeElement } = document;
      if (
        !dropdown ||
        !(activeElement instanceof Node) ||
        !anchor?.contains(activeElement)
      ) {
        return;
      }

      const options = [
        ...dropdown.querySelectorAll<HTMLButtonElement>(
          DROPDOWN_OPTION_SELECTOR,
        ),
      ];
      if (options.length === 0) {
        return;
      }

      const currentIndex = options.findIndex(
        (option) => option === activeElement,
      );
      let nextIndex = 0;
      if (event.key === 'ArrowDown') {
        nextIndex =
          currentIndex < 0 ? 0 : Math.min(currentIndex + 1, options.length - 1);
      } else if (currentIndex < 0) {
        nextIndex = options.length - 1;
      } else {
        nextIndex = Math.max(currentIndex - 1, 0);
      }

      event.preventDefault();
      options[nextIndex]?.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Box ref={dropdownRef} {...props}>
      {children}
    </Box>
  );
};
