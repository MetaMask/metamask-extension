import React from 'react';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
  IconColor,
  TextColor,
} from '../../../../helpers/constants/design-system';
import {
  ModalBody as BaseModalBody,
  Box,
  Text,
  Icon,
  IconSize,
  IconName,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type FeatureBlock = {
  title: string;
  description: string;
};

type ModalBodyProps = {
  title: string;
};

export const SolanaModalBody = ({ title }: ModalBodyProps) => {
  const t = useI18nContext();

  const FEATURE_BLOCKS: FeatureBlock[] = [
    {
      title: t('solanaSendReceiveSwapTokens'),
      description: t('solanaSendReceiveSwapTokensDescription'),
    },
    {
      title: t('solanaImportAccounts'),
      description: t('solanaImportAccountsDescription'),
    },
    {
      title: t('solanaMoreFeaturesComingSoon'),
      description: t('solanaMoreFeaturesComingSoonDescription'),
    },
  ];

  return (
    <BaseModalBody data-testid="solana-modal-body">
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        paddingTop={2}
        paddingBottom={2}
      >
        <Text variant={TextVariant.headingSm}>{title}</Text>
      </Box>

      {FEATURE_BLOCKS.map((feature, index) => (
        <Box
          display={Display.Flex}
          gap={2}
          key={`feature-block-${index}`}
          paddingTop={2}
          paddingBottom={2}
        >
          <Icon
            name={IconName.Info}
            size={IconSize.Md}
            color={IconColor.infoDefault}
            marginTop={1}
          />
          <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
            <Text variant={TextVariant.bodyMdBold}>{feature.title}</Text>
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
            >
              {feature.description}
            </Text>
          </Box>
        </Box>
      ))}
    </BaseModalBody>
  );
};
