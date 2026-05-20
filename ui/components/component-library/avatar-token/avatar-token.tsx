import React from 'react';
import classnames from 'clsx';
import { AvatarBase, AvatarBaseProps } from '../avatar-base';
import {
  Display,
  AlignItems,
  JustifyContent,
  TextColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { AvatarImage, useImageFallback } from '../avatar-base/avatar-image';
import type { PolymorphicRef } from '../box';
import type { AvatarTokenComponent } from './avatar-token.types';
import { AvatarTokenProps, AvatarTokenSize } from './avatar-token.types';

/**
 * @deprecated Please update your code to use `AvatarToken` from `@metamask/design-system-react`.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#from-extension-component-library | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-avatartoken--docs | Storybook Documentation}
 */
export const AvatarToken: AvatarTokenComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    {
      size = AvatarTokenSize.Md,
      name,
      src,
      showHalo,
      color = TextColor.textDefault,
      backgroundColor = BackgroundColor.backgroundAlternative,
      borderColor,
      className = '',
      ...props
    }: AvatarTokenProps<C>,
    ref: PolymorphicRef<C>,
  ) => {
    const showFallback = useImageFallback(src);

    const fallbackString = name?.[0] ?? '?';

    return (
      <AvatarBase
        ref={ref}
        size={size}
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        className={classnames(
          'mm-avatar-token',
          showHalo ? 'mm-avatar-token--with-halo' : '',
          className,
        )}
        {...{
          backgroundColor,
          borderColor,
          color,
          ...(props as AvatarBaseProps<C>),
        }}
      >
        {showFallback || !src ? (
          fallbackString
        ) : (
          <AvatarImage
            src={src}
            showHalo={showHalo}
            imageClassName="mm-avatar-token__token-image"
            reducedImageClassName="mm-avatar-token__token-image--size-reduced"
            blurredImageClassName="mm-avatar-token__token-image--blurred"
            label={`${name} logo`}
          />
        )}
      </AvatarBase>
    );
  },
);
