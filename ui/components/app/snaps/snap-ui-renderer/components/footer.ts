import { FooterElement, ButtonElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';

import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { UIComponentFactory } from './types';

export const DEFAULT_FOOTER = {
  element: 'Box',
  props: {
    display: Display.Flex,
    flexDirection: FlexDirection.Row,
    width: BlockSize.Full,
    padding: 4,
    className: 'snap-ui-renderer__footer',
    backgroundColor: BackgroundColor.backgroundDefault,
    style: {
      boxShadow: 'var(--shadow-size-lg) var(--color-shadow-default)',
    },
  },
};

const getDefaultButtons = (footer: FooterElement, onCancel: () => void) => {
  const children = getJsxChildren(footer);

  if (children.length === 1) {
    return {
      element: 'SnapFooterButton',
      key: 'default-button',
      props: {
        onCancel,
        isSnapAction: false,
      },
      children: 'Cancel',
    };
  }

  return undefined;
};

export const footer: UIComponentFactory<FooterElement> = ({
  element,
  onCancel,
}) => {
  const defaultButtons = getDefaultButtons(element, onCancel);

  const footerChildren = (getJsxChildren(element) as ButtonElement[]).map(
    (children) => {
      const { children: buttonChildren, ...props } = children.props;
      return {
        element: 'SnapFooterButton',
        key: `snap-footer-button-${props.name}`,
        props: {
          ...props,
          isSnapAction: true,
        },
        children: buttonChildren,
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
