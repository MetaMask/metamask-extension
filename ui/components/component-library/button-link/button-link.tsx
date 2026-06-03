import React from 'react';
import classnames from 'clsx';
import {
  BackgroundColor,
  Color,
} from '../../../helpers/constants/design-system';
import type { PolymorphicRef } from '../box';
import { ButtonBase, type ButtonBaseProps } from '../button-base';
import { IconSize } from '../icon';
import type { ButtonLinkProps } from './button-link.types';
import { ButtonLinkSize, ButtonLinkComponent } from './button-link.types';

/**
 * @deprecated ButtonLink is deprecated.
 * - Use `TextButton` from `@metamask/design-system-react` for inline links within text.
 * - For standalone link-style actions, use `Button` from `@metamask/design-system-react`
 * with `variant={ButtonVariant.Tertiary}` (e.g., for "Forgot password?" on unlock).
 *
 * Examples:
 * Inline: `<TextButton>Learn more</TextButton>`
 * Standalone: `<Button variant={ButtonVariant.Tertiary}>Forgot password?</Button>`
 *
 * This component will be removed in a future release.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#button-component | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-textbutton--docs | TextButton Storybook Documentation}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-button--docs | Button Storybook Documentation}
 */
export const ButtonLink: ButtonLinkComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'button' | 'a'>(
    {
      className = '',
      color,
      danger = false,
      disabled = false,
      loading = false,
      size = ButtonLinkSize.Auto,
      endIconProps,
      startIconProps,
      ...props
    }: ButtonLinkProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <ButtonBase
        className={classnames(className, 'mm-button-link', {
          'mm-button-link--type-danger': danger,
          'mm-button-link--disabled': disabled,
          'mm-button-link--loading': loading,
          'mm-button-link--size-inherit': size === ButtonLinkSize.Inherit,
          'mm-button-link--size-auto': size === ButtonLinkSize.Auto,
        })}
        paddingLeft={0}
        paddingRight={0}
        size={size === ButtonLinkSize.Inherit ? null : size}
        backgroundColor={BackgroundColor.transparent}
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        color={color || (danger ? Color.errorDefault : Color.primaryDefault)}
        borderRadius={null}
        startIconProps={{
          size:
            size === ButtonLinkSize.Inherit ? IconSize.Inherit : IconSize.Sm,
          ...startIconProps,
          className:
            size === ButtonLinkSize.Inherit
              ? `mm-button-link--size-inherit__icon ${
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
                  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                  startIconProps?.className || ''
                }`
              : '',
        }}
        endIconProps={{
          size:
            size === ButtonLinkSize.Inherit ? IconSize.Inherit : IconSize.Sm,
          ...endIconProps,
          className:
            size === ButtonLinkSize.Inherit
              ? `mm-button-link--size-inherit__icon ${
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
                  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                  endIconProps?.className || ''
                }`
              : '',
        }}
        iconLoadingProps={{
          size:
            size === ButtonLinkSize.Inherit ? IconSize.Inherit : IconSize.Md,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          color: color || (danger ? Color.errorDefault : Color.primaryDefault),
        }}
        ref={ref}
        {...{ disabled, loading, ...(props as ButtonBaseProps<C>) }}
      />
    );
  },
);
