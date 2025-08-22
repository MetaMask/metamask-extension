import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
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
    const [showFallback, setShowFallback] = useState(false);

    useEffect(() => {
      setShowFallback(!src);
    }, [src]);

    const fallbackString = name?.[0] ?? '?';

    const handleOnError = () => {
      setShowFallback(true);
    };

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
              <img
                src={src}
                className={
                  showHalo ? 'mm-avatar-network__network-image--blurred' : ''
                }
                aria-hidden="true"
              />
            )}
            <img
              className={
                showHalo
                  ? 'mm-avatar-network__network-image--size-reduced'
                  : 'mm-avatar-network__network-image'
              }
              onError={handleOnError}
              src={src}
              alt={(name && `${name} logo`) || 'network logo'}
            />
          </>
        )}
      </AvatarBase>
    );
  },
);
