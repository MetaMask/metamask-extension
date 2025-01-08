import React from 'react';
import Card from '../../../ui/card';
import {
  Box,
  IconName,
  Icon,
  Text,
  IconSize,
  Label,
} from '../../../component-library';
import {
  JustifyContent,
  Display,
  TextColor,
  FlexDirection,
  AlignItems,
  TextVariant,
} from '../../../../helpers/constants/design-system';

export const SelectSRP = ({
  srpName,
  srpAccounts,
  onClick,
}: {
  srpName: string;
  srpAccounts: number;
  onClick: () => void;
}) => {
  return (
    <Box>
      <Label>Select Secret Recovery Phrase</Label>
      <Card
        onClick={onClick}
        paddingTop={1}
        paddingBottom={1}
        className="select-srp__container"
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box>
            <Text>{srpName}</Text>
            <Text variant={TextVariant.bodySm} color={TextColor.textMuted}>
              ({srpAccounts} accounts)
            </Text>
          </Box>
          <Icon name={IconName.ArrowRight} size={IconSize.Sm} />
        </Box>
      </Card>
      <Text variant={TextVariant.bodySm} marginTop={1}>
        The Secret Recovery Phrase your new account will be generated from
      </Text>
    </Box>
  );
};
