import React from 'react';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  BorderStyle,
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
};

export default function OriginPill({ origin, dataTestId }: OriginPillProps) {
  const subjectMetadata = useSelector(getSubjectMetadata);

  const { iconUrl: siteImage = '' } = subjectMetadata[origin] || {};

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      marginTop={6}
      marginRight={4}
      marginLeft={4}
      padding={2}
      borderColor={BorderColor.borderMuted}
      borderStyle={BorderStyle.solid}
      borderRadius={BorderRadius.pill}
      borderWidth={1}
      data-testid={dataTestId}
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
