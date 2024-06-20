import React from 'react';
import { Box, Text } from '../../../../component-library';
import {
  AlignItems,
  Display,
  FlexWrap,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import Tooltip from '../../../../ui/tooltip';

export type ConfirmInfoRowTextProps = {
  text: string;
  tooltip?: string;
};

const InfoText = ({ text }: { text: string }) => (
  <Text color={TextColor.inherit} style={{ whiteSpace: 'pre-wrap' }}>
    {text}
  </Text>
);

export const ConfirmInfoRowText = ({
  text,
  tooltip,
}: ConfirmInfoRowTextProps) => {
  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      flexWrap={FlexWrap.Wrap}
      gap={2}
    >
      {tooltip ? (
        <Tooltip
          position="bottom"
          title={tooltip}
          wrapperStyle={{ minWidth: 0 }}
          interactive
        >
          <InfoText text={text} />
        </Tooltip>
      ) : (
        <InfoText text={text} />
      )}
    </Box>
  );
};
