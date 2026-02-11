import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  BoxBackgroundColor,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import Tooltip from '../../ui/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';

type PendingMerklRewardsProps = {
  claimableReward: string | null;
};

/**
 * Displays pending Merkl rewards information including the claimable bonus
 * amount and annual bonus APY. Shows a money bag icon, bonus label with
 * tooltip, and the dollar amount.
 *
 * @param props - Component props
 * @param props.claimableReward - Formatted claimable amount (e.g., "10.50"), or null to hide
 */
const PendingMerklRewards: React.FC<PendingMerklRewardsProps> = ({
  claimableReward,
}) => {
  const t = useI18nContext();

  if (!claimableReward) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      paddingTop={4}
      paddingBottom={4}
      paddingLeft={4}
      paddingRight={4}
      data-testid="pending-merkl-rewards"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={3}
      >
        {/* Money Bag Icon */}
        <Box
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          backgroundColor={BoxBackgroundColor.BackgroundAlternative}
          className="flex rounded-full"
          style={{ width: '40px', height: '40px', flexShrink: 0 }}
        >
          <Icon
            name={IconName.MoneyBag}
            size={IconSize.Md}
            color={IconColor.IconDefault}
          />
        </Box>

        {/* Claimable Bonus Text and Annual Bonus */}
        <Box flexDirection={BoxFlexDirection.Column} gap={1}>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
          >
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {t('merklRewardsClaimableBonus')}
            </Text>
            <Tooltip
              position="top"
              title={t('merklRewardsClaimableBonusTooltip')}
            >
              <Icon
                name={IconName.Info}
                size={IconSize.Sm}
                color={IconColor.IconAlternative}
                data-testid="claimable-bonus-info-icon"
              />
            </Tooltip>
          </Box>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.PrimaryDefault}
            fontWeight={FontWeight.Medium}
          >
            {t('merklRewardsAnnualBonus', ['3'])}
          </Text>
        </Box>
      </Box>

      {/* Claimable Bonus Amount Display */}
      <Text
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
        data-testid="claimable-reward-amount"
      >
        ${claimableReward}
      </Text>
    </Box>
  );
};

export default PendingMerklRewards;
