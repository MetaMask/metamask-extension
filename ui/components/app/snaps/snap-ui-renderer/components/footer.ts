import { FooterElement, ButtonElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';

import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { ButtonVariant } from '../../../../component-library';
import { UIComponent, UIComponentFactory, UIComponentParams } from './types';
import { button as buttonFn } from './button';

export const DEFAULT_FOOTER = {
  element: 'Box',
  key: 'default-footer',
  props: {
    display: Display.Flex,
    flexDirection: FlexDirection.Row,
    width: BlockSize.Full,
    gap: 4,
    padding: 4,
    className: 'snap-ui-renderer__footer',
    backgroundColor: BackgroundColor.backgroundDefault,
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
      element: 'SnapUIFooterButton',
      key: 'default-button',
      props: {
        onCancel,
        variant: ButtonVariant.Secondary,
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

  const providedChildren = getJsxChildren(element);
  const footerChildren: UIComponent[] = (
    providedChildren as ButtonElement[]
  ).map((children, index) => {
    const buttonMapped = buttonFn({
      ...params,
      element: children,
    } as UIComponentParams<ButtonElement>);
    return {
      element: 'SnapUIFooterButton',
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      key: `snap-footer-button-${buttonMapped.props?.name ?? index}`,
      props: {
        ...buttonMapped.props,
        snapVariant: buttonMapped.props?.variant,
        variant:
          providedChildren.length === 2 && index === 0
            ? ButtonVariant.Secondary
            : ButtonVariant.Primary,
        isSnapAction: true,
      },
      children: buttonMapped.children,
    };
  });

  if (defaultButtons) {
    footerChildren.unshift(defaultButtons as UIComponent);
  }

  return {
    ...DEFAULT_FOOTER,
    children: footerChildren,
  };
};
