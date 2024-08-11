import { FooterElement, ButtonElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';

import { NonEmptyArray } from '@metamask/controller-utils';
import { getSnapFooter } from '../utils';
import { UIComponent, UIComponentFactory } from './types';

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

  return getSnapFooter(footerChildren as unknown as NonEmptyArray<UIComponent>);
};
