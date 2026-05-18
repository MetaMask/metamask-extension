import React, { useState, useEffect } from 'react';
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
    const [showFallback, setShowFallback] = useState(!src);

    useEffect(() => {
      if (!src) {
        setShowFallback(true);
        return undefined;
      }

      let isMounted = true;
      const image = new Image();

      image.onload = () => {
        if (isMounted) {
          setShowFallback(false);
        }
      };
      image.onerror = () => {
        if (isMounted) {
          setShowFallback(true);
        }
      };
      setShowFallback(false);
      image.src = src;

      return () => {
        isMounted = false;
        image.onload = null;
        image.onerror = null;
        image.removeAttribute('src');
      };
    }, [src]);

    const fallbackString = name?.[0] ?? '?';
    const networkImageStyle = { backgroundImage: `url("${src}")` };

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
        {showFallback ? (
          fallbackString
        ) : (
          <>
            {showHalo && (
              <span
                style={networkImageStyle}
                className={
                  showHalo ? 'mm-avatar-network__network-image--blurred' : ''
                }
                aria-hidden="true"
              />
            )}
            <span
              role="img"
              className={
                showHalo
                  ? 'mm-avatar-network__network-image--size-reduced'
                  : 'mm-avatar-network__network-image'
              }
              style={networkImageStyle}
              aria-label={(name && `${name} logo`) || 'network logo'}
            />
          </>
        )}
      </AvatarBase>
    );
  },
);
