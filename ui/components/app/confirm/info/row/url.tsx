import React from 'react';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';
import {
  AlignItems,
  BorderRadius,
  Display,
  FlexWrap,
  IconColor,
  TextColor,
  TextVariant,
  BackgroundColor,
} from '../../../../../helpers/constants/design-system';

export type ConfirmInfoRowUrlProps = {
  url: string;
};

export const ConfirmInfoRowUrl = ({ url }: ConfirmInfoRowUrlProps) => {
  let urlObject;

  try {
    urlObject = new URL(url);
  } catch (e) {
    console.log(`ConfirmInfoRowUrl: new URL(url) cannot parse ${url}`);
  }

  const isHTTP = urlObject?.protocol === 'http:';

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      flexWrap={FlexWrap.Wrap}
      gap={2}
    >
      {isHTTP && (
        <Text
          variant={TextVariant.bodySm}
          display={Display.Flex}
          alignItems={AlignItems.center}
          borderRadius={BorderRadius.SM}
          backgroundColor={BackgroundColor.warningMuted}
          paddingLeft={1}
          paddingRight={1}
          color={TextColor.warningDefault}
        >
          <Icon
            name={IconName.Danger}
            color={IconColor.warningDefault}
            size={IconSize.Sm}
            marginInlineEnd={1}
          />
          HTTP
        </Text>
      )}
      <Text color={TextColor.inherit}>{url}</Text>
    </Box>
  );
};
