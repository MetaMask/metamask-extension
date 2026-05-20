import React from 'react';
import classnames from 'clsx';
import {
  Display,
  AlignItems,
  JustifyContent,
  TextColor,
  BackgroundColor,
  BorderColor,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import type { PolymorphicRef } from '../box';
import { AvatarBase, AvatarBaseProps } from '../avatar-base';
import { AvatarImage, useImageFallback } from '../avatar-base/avatar-image';
import type { AvatarNetworkComponent } from './avatar-network.types';
import { AvatarNetworkProps, AvatarNetworkSize } from './avatar-network.types';

/**
 * @deprecated Please update your code to use `AvatarNetwork` from `@metamask/design-system-react`.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#from-extension-component-library | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-avatarnetwork--docs | Storybook Documentation}
 */
export const AvatarNetwork: AvatarNetworkComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    {
      size = AvatarNetworkSize.Md,
      name,
      src,
      showHalo,
      color = TextColor.textDefault,
      backgroundColor = BackgroundColor.backgroundAlternative,
      borderColor = BorderColor.backgroundDefault,
      className = '',
      ...props
    }: AvatarNetworkProps<C>,
    ref?: PolymorphicRef<C>,
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
          'mm-avatar-network',
          showHalo ? 'mm-avatar-network--with-halo' : '',
          className,
        )}
        borderRadius={BorderRadius.MD}
        borderWidth={1}
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
            imageClassName="mm-avatar-network__network-image"
            reducedImageClassName="mm-avatar-network__network-image--size-reduced"
            blurredImageClassName="mm-avatar-network__network-image--blurred"
            label={(name && `${name} logo`) || 'network logo'}
          />
        )}
      </AvatarBase>
    );
  },
);
