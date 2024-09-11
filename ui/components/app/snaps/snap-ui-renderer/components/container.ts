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
  promptLegacyProps,
  t,
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
      t,
      ...params,
      element: child as JSXElement,
    }),
  );

  // Injects the prompt input field into the template if the dialog is a prompt type.
  if (promptLegacyProps) {
    templateChildren.push({
      element: 'FormTextField',
      key: 'snap-prompt-input',
      props: {
        marginLeft: 4,
        marginRight: 4,
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
        className: 'snap-ui-renderer__footer-centered',
      },
      children: {
        element: 'SnapFooterButton',
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
      height: BlockSize.Full,
      className: 'snap-ui-renderer__container',
      style: {
        overflowY: 'auto',
        paddingBottom: useFooter ? '74px' : 'initial',
      },
    },
  };
};
