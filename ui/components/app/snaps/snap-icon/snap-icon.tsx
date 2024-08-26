import React, { FunctionComponent } from 'react';

import { useSelector } from 'react-redux';
import {
  getSnapMetadata,
  getTargetSubjectMetadata,
} from '../../../../selectors';
import { getAvatarFallbackLetter } from '../../../../helpers/utils/util';
import {
  AvatarBase,
  AvatarBaseSize,
  AvatarFavicon,
  AvatarFaviconProps,
  AvatarFaviconSize,
  IconSize,
} from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  JustifyContent,
  TextColor,
} from '../../../../helpers/constants/design-system';

type SnapIconProps = {
  snapId: string;
  avatarSize?: IconSize;
  borderWidth?: number;
  className?: string;
  badgeBackgroundColor?: BackgroundColor;
} & Omit<AvatarFaviconProps<'span'>, 'name'>;

export const SnapIcon: FunctionComponent<SnapIconProps> = ({
  snapId,
  avatarSize = IconSize.Lg,
  ...props
}) => {
  const subjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );

  const { name: snapName } = useSelector((state) =>
    /* @ts-expect-error wrong type on selector. */
    getSnapMetadata(state, snapId),
  );

  const iconUrl = subjectMetadata?.iconUrl;

  // We choose the first non-symbol char as the fallback icon.
  const fallbackIcon = getAvatarFallbackLetter(snapName);

  return iconUrl ? (
    <AvatarFavicon
      style={{
        backgroundColor: 'var(--color-background-alternative-hover)',
      }}
      src={iconUrl}
      name={snapName}
      {...props}
      size={avatarSize as unknown as AvatarFaviconSize}
    />
  ) : (
    <AvatarBase
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      color={TextColor.textAlternative}
      style={{
        borderWidth: '0px',
        backgroundColor: 'var(--color-background-alternative-hover)',
      }}
      {...props}
      size={avatarSize as unknown as AvatarBaseSize}
    >
      {fallbackIcon}
    </AvatarBase>
  );
};
