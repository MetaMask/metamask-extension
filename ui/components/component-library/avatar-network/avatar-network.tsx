import React, { useState, useEffect, Ref } from 'react';
import classnames from 'classnames';
import {
  DISPLAY,
  AlignItems,
  JustifyContent,
  TextColor,
  BackgroundColor,
  BorderColor,
} from '../../../helpers/constants/design-system';
import { AvatarBase, AvatarBaseSize } from '../avatar-base';

import { AvatarNetworkProps } from './avatar-network.types';

export const AvatarNetwork = React.forwardRef(
  (
    {
      size = AvatarBaseSize.Md,
      name,
      src,
      showHalo,
      color = TextColor.textDefault,
      backgroundColor = BackgroundColor.backgroundAlternative,
      borderColor = BorderColor.transparent,
      className = '',
      ...props
    }: AvatarNetworkProps,
    ref: Ref<HTMLElement>,
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
        display={DISPLAY.FLEX}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        className={classnames(
          'mm-avatar-network',
          showHalo ? 'mm-avatar-network--with-halo' : '',
          className,
        )}
        {...{ backgroundColor, borderColor, color, ...props }}
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
              alt={`${name} logo` || 'network logo'}
            />
          </>
        )}
      </AvatarBase>
    );
  },
);

AvatarNetwork.displayName = 'AvatarNetwork';
