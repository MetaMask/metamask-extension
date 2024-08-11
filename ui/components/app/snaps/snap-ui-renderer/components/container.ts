import { BoxElement, JSXElement, BoxProps } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { getSnapFooter, mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';

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

  const templateChildren = children.map((children) =>
    mapToTemplate({
      useFooter,
      onCancel,
      ...params,
      element: children as JSXElement,
    }),
  );

  if (useFooter && !children[1]) {
    templateChildren.push(
      getSnapFooter([
        {
          element: 'SnapFooterButton',
          key: 'default-button',
          props: {
            onCancel,
            isSnapAction: false,
          },
          children: 'Cancel',
        },
      ]),
    );
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
