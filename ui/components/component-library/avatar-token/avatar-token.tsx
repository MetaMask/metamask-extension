import React, { useState, useEffect } from 'react';
import classnames from 'clsx';
import { AvatarBase, AvatarBaseProps } from '../avatar-base';
import {
  Display,
  AlignItems,
  JustifyContent,
  TextColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
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
    const tokenImageStyle = { backgroundImage: `url("${src}")` };

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
        {showFallback ? (
          fallbackString
        ) : (
          <>
            {showHalo && (
              <span
                style={tokenImageStyle}
                className={
                  showHalo ? 'mm-avatar-token__token-image--blurred' : ''
                }
                aria-hidden="true"
              />
            )}
            <span
              role="img"
              className={
                showHalo
                  ? 'mm-avatar-token__token-image--size-reduced'
                  : 'mm-avatar-token__token-image'
              }
              style={tokenImageStyle}
              aria-label={`${name} logo`}
            />
          </>
        )}
      </AvatarBase>
    );
  },
);
