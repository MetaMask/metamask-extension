import { FooterElement, ButtonElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';

import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { UIComponentFactory, UIComponentParams } from './types';
import { button as buttonFn } from './button';

export const DEFAULT_FOOTER = {
  element: 'Box',
  key: 'default-footer',
  props: {
    display: Display.Flex,
    flexDirection: FlexDirection.Row,
    width: BlockSize.Full,
    padding: 4,
    className: 'snap-ui-renderer__footer',
    backgroundColor: BackgroundColor.backgroundDefault,
    style: {
      boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
      height: '74px',
      position: 'fixed',
      bottom: 0,
    },
  },
};

const getDefaultButtons = (
  footer: FooterElement,
  t: (value: string) => string,
  onCancel?: () => void,
) => {
  const children = getJsxChildren(footer);

  // If onCancel is omitted by the caller we assume that it is safe to not display the default footer.
  if (children.length === 1 && onCancel) {
    return {
      element: 'SnapFooterButton',
      key: 'default-button',
      props: {
        onCancel,
        isSnapAction: false,
      },
      children: t('cancel'),
    };
  }

  return undefined;
};

export const footer: UIComponentFactory<FooterElement> = ({
  element,
  t,
  onCancel,
  ...params
}) => {
  const defaultButtons = getDefaultButtons(element, t, onCancel);

  const footerChildren = (getJsxChildren(element) as ButtonElement[]).map(
    (children, index) => {
      const buttonMapped = buttonFn({
        ...params,
        element: children,
      } as UIComponentParams<ButtonElement>);
      return {
        element: 'SnapFooterButton',
        key: `snap-footer-button-${buttonMapped.props?.name ?? index}`,
        props: {
          ...buttonMapped.props,
          isSnapAction: true,
        },
        children: buttonMapped.children,
      };
    },
  );

  if (defaultButtons) {
    footerChildren.unshift(defaultButtons);
  }

  return {
    ...DEFAULT_FOOTER,
    children: footerChildren,
  };
};
