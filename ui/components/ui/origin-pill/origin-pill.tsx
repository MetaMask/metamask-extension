import React from 'react';
import { useSelector } from 'react-redux';
import { Text, TextColor, TextVariant } from '@metamask/design-system-react';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { getSubjectMetadata } from '../../../selectors';
import { AvatarFavicon, Box } from '../../component-library';

type OriginPillProps = {
  origin: string;
  dataTestId: string;
  style?: React.CSSProperties;
  textStyle?: React.CSSProperties;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OriginPill({
  origin,
  dataTestId,
  style,
  textStyle,
}: OriginPillProps) {
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
      style={style}
    >
      <AvatarFavicon
        src={siteImage}
        name={origin}
        data-testid={`${dataTestId}-avatar-favicon`}
      />
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextAlternative}
        data-testid={`${dataTestId}-text`}
        style={textStyle}
        className="origin-pill-text ms-1"
        asChild
      >
        <h6>{origin}</h6>
      </Text>
    </Box>
  );
}
