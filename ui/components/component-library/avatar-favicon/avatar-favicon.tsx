import React from 'react';
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
import { PolymorphicRef } from '../box';
import {
  AvatarFaviconComponent,
  AvatarFaviconProps,
  AvatarFaviconSize,
} from './avatar-favicon.types';

export const AvatarFavicon: AvatarFaviconComponent = React.forwardRef(
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
    const t = useI18nContext();
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
          <img
            className="mm-avatar-favicon__image"
            src={src}
            alt={t('logo', [name])}
          />
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
