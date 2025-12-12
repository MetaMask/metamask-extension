import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { AvatarBase, AvatarBaseProps } from '../avatar-base';
import { IconName, Icon, IconSize } from '../icon';
import {
  BorderColor,
  Display,
  AlignItems,
  JustifyContent,
  IconColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAvatarFallbackLetter } from '../../../helpers/utils/util';
import { PolymorphicRef } from '../box';
import {
  AvatarFaviconComponent,
  AvatarFaviconProps,
  AvatarFaviconSize,
} from './avatar-favicon.types';

const UNKNOWN_FALLBACK_LABEL = 'Unknown';

const Favicon = (props: { src?: string; name?: string | null }) => {
  const { src, name } = props;
  const t = useI18nContext();
  const [imageLoadError, setImageLoadError] = useState(false);

  const accessibleName = (() => {
    if (typeof name === 'string') {
      const trimmedName = name.trim();
      if (trimmedName.length > 0) {
        return trimmedName;
      }
    }

    const unknownLabel = t('unknown');

    if (typeof unknownLabel === 'string') {
      return unknownLabel;
    }

    return UNKNOWN_FALLBACK_LABEL;
  })();

  const logoAltMessage = t('logo', [accessibleName]);
  const altText =
    typeof logoAltMessage === 'string' ? logoAltMessage : accessibleName;

  useEffect(() => {
    setImageLoadError(false);
  }, [src]);

  const handleImageError = () => {
    setImageLoadError(true);
  };

  return imageLoadError ? (
    <div className="h-full w-full content-center bg-background-muted">
      {getAvatarFallbackLetter(accessibleName)}
    </div>
  ) : (
    <img
      className="mm-avatar-favicon__image"
      src={src}
      alt={altText}
      onError={handleImageError}
    />
  );
};

/**
 * @deprecated Please update your code to use `AvatarFavicon` from `@metamask/design-system-react`
 */
export const AvatarFavicon: AvatarFaviconComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    {
      size = AvatarFaviconSize.Md,
      src,
      name = 'avatar-favicon',
      className = '',
      fallbackIconProps,
      borderColor = BorderColor.transparent,
      ...props
    }: AvatarFaviconProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const normalizedName = name ?? 'avatar-favicon';

    return (
      <AvatarBase
        ref={ref}
        size={size}
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        className={classnames('mm-avatar-favicon', className)}
        {...{ borderColor, ...(props as AvatarBaseProps<C>) }}
      >
        {src ? (
          <Favicon src={src} name={normalizedName} />
        ) : (
          <Icon
            name={IconName.Global}
            color={IconColor.iconDefault}
            size={IconSize.Md}
            {...fallbackIconProps}
          />
        )}
      </AvatarBase>
    );
  },
);
