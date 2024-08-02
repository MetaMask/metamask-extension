import React from 'react';

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
import { FunctionComponent } from 'react';

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
      size={avatarSize as unknown as AvatarFaviconSize}
      src={iconUrl}
      name={snapName}
      {...props}
    />
  ) : (
    <AvatarBase
      {...props}
      size={avatarSize as unknown as AvatarBaseSize}
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      color={TextColor.textAlternative}
      style={{
        borderWidth: '0px',
        backgroundColor: 'var(--color-background-alternative-hover)',
      }}
    >
      {fallbackIcon}
    </AvatarBase>
  );
};
