import React from 'react';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getSubjectMetadata } from '../../../selectors';
import { AvatarFavicon, Box, Text } from '../../component-library';

type OriginPillProps = {
  origin: string;
  dataTestId: string;
  style?: React.CSSProperties;
};

export default function OriginPill({
  origin,
  dataTestId,
  style,
}: OriginPillProps) {
  const subjectMetadata = useSelector(getSubjectMetadata);

  const { iconUrl: siteImage = '' } = subjectMetadata[origin] || {};

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      marginTop={1}
      marginBottom={3}
      marginRight={4}
      marginLeft={4}
      padding={2}
      data-testid={dataTestId}
      style={style}
    >
      <AvatarFavicon
        src={siteImage}
        name={origin}
        data-testid={`${dataTestId}-avatar-favicon`}
      />
      <Text
        variant={TextVariant.bodySm}
        as="h6"
        color={TextColor.textAlternative}
        marginLeft={1}
        data-testid={`${dataTestId}-text`}
      >
        {origin}
      </Text>
    </Box>
  );
}
