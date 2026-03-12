import React, { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import {
  Box,
  BoxAlignItems,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  IconColor,
  IconName,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
  AvatarIcon,
  AvatarIconSize,
  AvatarIconSeverity,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import { useI18nContext } from '../../../hooks/useI18nContext';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
  Icon,
  IconName as LegacyIconName,
  IconSize,
  Popover,
  PopoverPosition,
} from '../../component-library';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { IconColor as LegacyIconColor } from '../../../helpers/constants/design-system';
import { setMerklClaimModalShown } from '../../../store/actions';
import { selectMerklClaimModalShown } from '../../../selectors/musd/persisted-state';
import { useMerklRewards } from './hooks/useMerklRewards';
import { useMerklClaim } from './hooks/useMerklClaim';
import { useOnMerklClaimConfirmed } from './hooks/useOnMerklClaimConfirmed';
import {
  MUSD_CONVERSION_APY,
  MUSD_CONVERSION_BONUS_TERMS_OF_USE,
} from './constants';
import { MerklClaimModal } from './merkl-claim-modal';

type MusdClaimableBonusProps = {
  tokenAddress: string;
  chainId: Hex;
};

const POPOVER_STYLE = {
  zIndex: 1000,
  backgroundColor: 'var(--color-text-default)',
  paddingTop: '6px',
  paddingBottom: '6px',
  paddingLeft: '16px',
  paddingRight: '16px',
  maxWidth: 240,
} as const;

export const MusdClaimableBonus: React.FC<MusdClaimableBonusProps> = ({
  tokenAddress,
  chainId,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const merklClaimModalShown = useSelector(selectMerklClaimModalShown);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const tooltipTriggerRef = useRef<HTMLButtonElement>(null);

  const { isEligible, hasClaimableReward, rewardAmountFiat, refetch } =
    useMerklRewards({
      tokenAddress,
      chainId,
      showMerklBadge: true,
    });

  useOnMerklClaimConfirmed(refetch);

  const { claimRewards, isClaiming, error } = useMerklClaim({
    tokenAddress,
    chainId,
  });

  const handleClaim = useCallback(() => {
    if (!merklClaimModalShown) {
      setShowModal(true);
      return;
    }
    claimRewards();
  }, [merklClaimModalShown, claimRewards]);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleModalContinue = useCallback(async () => {
    setShowModal(false);
    await dispatch(setMerklClaimModalShown());
    await claimRewards();
  }, [dispatch, claimRewards]);

  if (!isEligible || !hasClaimableReward) {
    return null;
  }

  const formattedReward =
    rewardAmountFiat === null ? null : `$${rewardAmountFiat.toFixed(2)}`;

  const tooltipContent = (
    <Text variant={TextVariant.BodyMd} color={TextColor.InfoInverse}>
      {t('musdClaimableBonusTooltip', [
        String(MUSD_CONVERSION_APY),
        <TextButton
          key="terms-link"
          size={TextButtonSize.BodyMd}
          isInverse
          asChild
        >
          <a
            href={MUSD_CONVERSION_BONUS_TERMS_OF_USE}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline' }}
          >
            {t('musdTermsApply')}
          </a>
        </TextButton>,
      ])}
    </Text>
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      paddingLeft={4}
      paddingRight={4}
      data-testid="musd-claimable-bonus"
    >
      <Box
        borderColor={BoxBorderColor.BorderMuted}
        marginTop={6}
        marginBottom={4}
        style={{ borderTopWidth: 1, borderTopStyle: 'solid', height: 0 }}
      />
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={4}
        paddingTop={3}
        paddingBottom={4}
      >
        <AvatarIcon
          iconName={IconName.MoneyBag}
          size={AvatarIconSize.Lg}
          severity={AvatarIconSeverity.Neutral}
          iconProps={{ color: IconColor.IconDefault }}
        />
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Between}
          style={{ flex: 1 }}
        >
          <Box flexDirection={BoxFlexDirection.Column}>
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={1}
            >
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
                {t('musdClaimableBonus')}
              </Text>
              <Box>
                <button
                  ref={tooltipTriggerRef}
                  type="button"
                  onClick={() => setIsTooltipOpen((prev) => !prev)}
                  style={{
                    marginLeft: '2px',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <Icon
                    name={LegacyIconName.Info}
                    size={IconSize.Sm}
                    color={LegacyIconColor.iconDefault}
                  />
                </button>
                <Popover
                  isOpen={isTooltipOpen}
                  position={PopoverPosition.Top}
                  referenceElement={tooltipTriggerRef.current}
                  hasArrow
                  onPressEscKey={() => setIsTooltipOpen(false)}
                  onClickOutside={() => setIsTooltipOpen(false)}
                  isPortal
                  style={POPOVER_STYLE}
                >
                  {tooltipContent}
                </Popover>
              </Box>
            </Box>
            <Text variant={TextVariant.BodySm} color={TextColor.PrimaryDefault}>
              {t('merklClaimableBonusSubtitle', [String(MUSD_CONVERSION_APY)])}
            </Text>
          </Box>
          {formattedReward && (
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {formattedReward}
            </Text>
          )}
        </Box>
      </Box>
      <Button
        size={ButtonSize.Lg}
        variant={ButtonVariant.Secondary}
        isFullWidth
        onClick={handleClaim}
        disabled={isClaiming}
        isLoading={isClaiming}
        data-testid="musd-claimable-bonus-claim-button"
      >
        {t('merklClaimButton')}
      </Button>
      {error && (
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.ErrorDefault}
          data-testid="musd-claimable-bonus-error"
          style={{ marginTop: 4 }}
        >
          {t('merklRewardsUnexpectedError')}
        </Text>
      )}
      <MerklClaimModal
        isOpen={showModal}
        onClose={handleModalClose}
        onContinue={handleModalContinue}
      />
    </Box>
  );
};
