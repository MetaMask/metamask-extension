import { BoxElement, JSXElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { mapToTemplate } from '../utils';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { UIComponentFactory } from './types';
import { DEFAULT_FOOTER } from './footer';

export const container: UIComponentFactory<BoxElement> = ({
  element,
  useFooter,
  onCancel,
  ...params
}) => {
  const children = getJsxChildren(element);

  // Remove footer if it's not allowed
  if (!useFooter && children.length === 2) {
    children.pop();
  }

  const templateChildren = children.map((child) =>
    mapToTemplate({
      useFooter,
      onCancel,
      ...params,
      element: child as JSXElement,
    }),
  );

  if (useFooter && !children[1]) {
    templateChildren.push({
      ...DEFAULT_FOOTER,
      children: {
        element: 'SnapFooterButton',
        key: 'default-button',
        props: {
          onCancel,
          isSnapAction: false,
        },
        children: 'Cancel',
      },
    });
  }

  return {
    element: 'Box',
    children: templateChildren,
    props: {
      display: Display.Flex,
      flexDirection: FlexDirection.Column,
      height: BlockSize.Full,
      className: 'snap-ui-renderer__container',
    },
  };
};
