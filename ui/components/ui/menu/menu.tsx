import { VirtualElement } from '@popperjs/core';
import classnames from 'classnames';
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PopperOptions, usePopper } from 'react-popper';

type MenuProps = {
  anchorElement: Element | VirtualElement | null | undefined;
  children: React.ReactNode;
  className: string;
  'data-testid': string;
  onHide: () => void;
  popperOptions: PopperOptions;
};

/**
 * @deprecated The `<Menu />` component has been deprecated in favor of the new `<Popover>` component from the component-library.
 * Please update your code to use the new `<Popover>` component instead, which can be found at ui/components/component-library/popover/popover.tsx.
 * You can find documentation for the new `Popover` component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-popover--docs}
 * If you would like to help with the replacement of the old `Menu` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-extension/issues/20498}
 */

const Menu = ({
  anchorElement,
  children,
  className,
  'data-testid': dataTestId,
  onHide,
  popperOptions,
}: MenuProps) => {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );
  const popoverContainerElement = useRef(
    document.getElementById('popover-content'),
  );

  const { attributes, styles } = usePopper(
    anchorElement,
    popperElement,
    popperOptions,
  );

  return createPortal(
    <>
      <div
        className="menu__background"
        data-testid={dataTestId}
        onClick={onHide}
      />
      <div
        className={classnames('menu__container', className)}
        data-testid={className}
        ref={setPopperElement as React.Ref<HTMLDivElement>}
        style={styles.popper}
        {...attributes.popper}
      >
        {children}
      </div>
    </>,
    popoverContainerElement.current as Element,
  );
};

export default Menu;
