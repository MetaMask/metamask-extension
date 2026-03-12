import { AvatarAccountSize } from '@metamask/design-system-react';
import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useFallbackDisplayName } from '../../../../../components/app/confirm/info/row/hook';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import useConfirmationNetworkInfo from '../../../hooks/useConfirmationNetworkInfo';
import { AdvancedDetails } from '../../confirm/info/shared/advanced-details/advanced-details';
import { GasFeesDetails } from '../../confirm/info/shared/gas-fees-details/gas-fees-details';
import MusdClaimHeading from './musd-claim-heading';

/**
 * Custom section wrapper for mUSD claim confirmation.
 * Matches Figma: 16px padding, 8px border radius, backgroundMuted color.
 * Use reducedPadding for sections with components that have their own internal 8px padding.
 *
 * @param options - Component props
 * @param options.children - Child elements to render inside the section
 * @param options.reducedPadding - Whether to use reduced padding (8px vs 16px)
 */
const ClaimSection = ({
  children,
  'data-testid': dataTestId,
  reducedPadding = false,
}: {
  children: React.ReactNode;
  'data-testid'?: string;
  reducedPadding?: boolean;
}) => (
  <Box
    data-testid={dataTestId}
    backgroundColor={BackgroundColor.backgroundMuted}
    borderRadius={BorderRadius.LG}
    padding={reducedPadding ? 2 : 4}
  >
    {children}
  </Box>
);

/**
 * Custom "Claiming to" row component for mUSD claim confirmation.
 * Built to match Figma design exactly.
 */
const ClaimingToRow = () => {
  const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { displayName } = useFallbackDisplayName(transactionMeta.txParams.from);

  return (
    <Box display={Display.Flex} alignItems={AlignItems.center}>
      <Text variant={TextVariant.bodyMdMedium} style={{ flex: 1 }}>
        {t('musdClaimClaimingTo')}
      </Text>
      <Icon
        name={IconName.ArrowRight}
        size={IconSize.Sm}
        color={IconColor.iconAlternative}
      />
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.flexEnd}
        style={{ flex: 1 }}
      >
        <Box
          backgroundColor={BackgroundColor.backgroundHover}
          borderRadius={BorderRadius.LG}
          display={Display.Flex}
          alignItems={AlignItems.center}
          paddingLeft={1}
          paddingRight={2}
          gap={1}
          style={{ height: '24px' }}
        >
          <PreferredAvatar
            address={transactionMeta.txParams.from}
            size={AvatarAccountSize.Sm}
          />
          <Text variant={TextVariant.bodyMd}>{displayName}</Text>
        </Box>
      </Box>
    </Box>
  );
};

/**
 * Custom Network row for mUSD claim confirmation.
 * Matches Figma design exactly.
 */
const ClaimNetworkRow = () => {
  const t = useI18nContext();
  const { networkImageUrl, networkDisplayName } = useConfirmationNetworkInfo();

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.center}
    >
      <Text variant={TextVariant.bodyMdMedium}>{t('network')}</Text>
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
        <AvatarNetwork
          size={AvatarNetworkSize.Xs}
          name={networkDisplayName}
          src={networkImageUrl}
        />
        <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
          {networkDisplayName}
        </Text>
      </Box>
    </Box>
  );
};

/**
 * Info component for mUSD claim (Merkl rewards) confirmation screen.
 *
 * Layout matches Figma design:
 * 1. Hero row - mUSD avatar + claim amount + fiat value
 * 2. Claiming to section with account pill
 * 3. Network section
 * 4. Network fee section
 * 5. Advanced details (nonce, tx data - shown when toggled)
 */
export const MusdClaimInfo = () => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={2}
      data-testid="musd-claim-info"
    >
      <MusdClaimHeading />
      <ClaimSection data-testid="musd-claim-details-section">
        <ClaimingToRow />
      </ClaimSection>
      <ClaimSection data-testid="musd-claim-network-section">
        <ClaimNetworkRow />
      </ClaimSection>
      <ClaimSection data-testid="musd-claim-gas-section" reducedPadding>
        <GasFeesDetails />
        <AdvancedDetails />
      </ClaimSection>
    </Box>
  );
};
