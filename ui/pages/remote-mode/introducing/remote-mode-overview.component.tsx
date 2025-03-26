import React from 'react';
import {
  Box,
  Text,
  Icon,
  IconName,
} from '../../../components/component-library';
import {
  FontWeight,
  TextVariant,
  Display,
  JustifyContent,
  TextColor,
  IconColor,
} from '../../../helpers/constants/design-system';

export default function RemoteModeOverview() {

  return (
    <>
      <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Bold}>
        Introducing Remote Mode
      </Text>
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternativeSoft}>
        Safely access your hardware wallet funds without plugging it in.
      </Text>
      <Box marginTop={4} marginBottom={6}>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
        >
          <Icon name={IconName.CheckBold} color={IconColor.successDefault} />
          <Text>Easier yet safe to trade with cold funds. Never miss a market opportunity.</Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
        >
          <Icon name={IconName.CheckBold} color={IconColor.successDefault} />
          <Text>Use allowances for transactions, limiting exposure of cold funds & keys.</Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
        >
          <Icon name={IconName.CheckBold} color={IconColor.successDefault} />
          <Text>Set your terms with spending caps & other smart contract enforced rules.</Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
        >
          <Icon name={IconName.CheckBold} color={IconColor.successDefault} />
          <Text>Get all the benefits of a smart account, and switch back anytime.</Text>
        </Box>
      </Box>
    </>
  );
}
