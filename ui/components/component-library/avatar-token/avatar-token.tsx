import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { AvatarBase, AvatarBaseProps } from '../avatar-base';
import {
  Display,
  AlignItems,
  JustifyContent,
  TextColor,
  BorderColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import type { PolymorphicRef } from '../box';
import type { AvatarTokenComponent } from './avatar-token.types';
import { AvatarTokenProps, AvatarTokenSize } from './avatar-token.types';

export const AvatarToken: AvatarTokenComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      size = AvatarTokenSize.Md,
      name,
      src,
      showHalo,
      color = TextColor.textDefault,
      backgroundColor = BackgroundColor.backgroundAlternative,
      borderColor = BorderColor.transparent,
      className = '',
      ...props
    }: AvatarTokenProps<C>,
    ref: PolymorphicRef<C>,
  ) => {
    const [showFallback, setShowFallback] = useState(false);

    useEffect(() => {
      setShowFallback(!src);
    }, [src]);

    const handleOnError = () => {
      setShowFallback(true);
    };

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
        {showFallback ? (
          fallbackString
        ) : (
          <>
            {showHalo && (
              <img
                src={src}
                className={
                  showHalo ? 'mm-avatar-token__token-image--blurred' : ''
                }
                aria-hidden="true"
              />
            )}
            <img
              className={
                showHalo
                  ? 'mm-avatar-token__token-image--size-reduced'
                  : 'mm-avatar-token__token-image'
              }
              onError={handleOnError}
              src={src}
              alt={`${name} logo` || 'token logo'}
            />
          </>
        )}
      </AvatarBase>
    );
  },
);
