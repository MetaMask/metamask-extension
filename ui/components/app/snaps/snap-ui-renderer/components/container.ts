import { Box, ContainerElement, JSXElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { mapToTemplate } from '../utils';
import {
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { UIComponent, UIComponentFactory } from './types';
import { DEFAULT_FOOTER } from './footer';

export const container: UIComponentFactory<ContainerElement> = ({
  element,
  useFooter,
  onCancel,
  promptLegacyProps,
  t,
  ...params
}) => {
  const children = getJsxChildren(element);

  // Remove footer if it's not allowed
  if (!useFooter && children.length === 2) {
    children.pop();
  }

  const firstChildIsBox =
    typeof children[0] !== 'string' && children[0]?.type === 'Box';

  // Ensure the first child is always a Box to apply layout styles correctly
  const containerChildren = firstChildIsBox
    ? children
    : [Box({ children: children[0] as JSXElement }), ...children.slice(1)];

  const templateChildren = containerChildren.map((child) =>
    mapToTemplate({
      useFooter,
      onCancel,
      t,
      ...params,

      element: child as JSXElement,
    }),
  );

  // Injects the prompt input field into the template if the dialog is a prompt type.
  if (promptLegacyProps) {
    // We can safely push to the first child's children as we ensure it's always a Box.
    (templateChildren[0].children as UIComponent[])?.push({
      element: 'FormTextField',
      key: 'snap-prompt-input',
      props: {
        className: 'snap-prompt-input',
        value: promptLegacyProps.inputValue,
        onChange: promptLegacyProps.onInputChange,
        placeholder: promptLegacyProps.placeholder,
        maxLength: 300,
      },
    });
  }

  // Injects the default footer if the dialog uses default footer but none was provided.
  // If onCancel is omitted by the caller we assume that it is safe to not display the default footer.
  if (useFooter && onCancel && !children[1]) {
    templateChildren.push({
      ...DEFAULT_FOOTER,
      props: {
        ...DEFAULT_FOOTER.props,
        className: 'snap-ui-renderer__footer snap-ui-renderer__footer-centered',
      },
      children: {
        element: 'SnapUIFooterButton',
        key: 'default-button',
        props: {
          onCancel,
          isSnapAction: false,
        },
        children: t('close'),
      },
    });
  }

  return {
    element: 'Box',
    children: templateChildren,
    props: {
      display: Display.Flex,
      flexDirection: FlexDirection.Column,
      className: 'snap-ui-renderer__container',
    },
  };
};
