import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import {
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setMerklClaimModalShown } from '../../../store/actions';
import { selectMerklClaimModalShown } from '../../../selectors/musd/persisted-state';
import { useMerklClaim } from './hooks/useMerklClaim';
import { useOnMerklClaimConfirmed } from './hooks/useOnMerklClaimConfirmed';
import { MerklClaimModal } from './merkl-claim-modal';

export const ClaimBonusBadge = ({
  label,
  tokenAddress,
  chainId,
  refetchRewards,
}: {
  label: string;
  tokenAddress: string;
  chainId: Hex;
  refetchRewards: () => void;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const merklClaimModalShown = useSelector(selectMerklClaimModalShown);
  const [showModal, setShowModal] = useState(false);

  // Refetch rewards when a pending claim is confirmed
  useOnMerklClaimConfirmed(refetchRewards);

  const { claimRewards, isClaiming, error } = useMerklClaim({
    tokenAddress,
    chainId,
  });

  // Show modal first if not shown before, otherwise trigger claim directly
  const handleBadgeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!merklClaimModalShown) {
        setShowModal(true);
        return;
      }
      claimRewards();
    },
    [merklClaimModalShown, claimRewards],
  );

  const handleModalClose = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleModalContinue = useCallback(async () => {
    setShowModal(false);
    await dispatch(setMerklClaimModalShown());
    await claimRewards();
  }, [dispatch, claimRewards]);

  if (isClaiming) {
    return (
      <Icon
        name={IconName.Loading}
        size={IconSize.Sm}
        color={IconColor.PrimaryDefault}
        style={{ animation: 'spin 1.2s linear infinite' }}
        data-testid="claim-bonus-spinner"
      />
    );
  }

  if (error) {
    return (
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.ErrorDefault}
        data-testid="claim-bonus-error"
        style={{ textAlign: 'end' }}
      >
        {t('merklRewardsUnexpectedError')}
      </Text>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleBadgeClick}
        style={{
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          font: 'inherit',
        }}
      >
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={TextColor.PrimaryDefault}
          data-testid="claim-bonus-badge"
        >
          {label}
        </Text>
      </button>
      <MerklClaimModal
        isOpen={showModal}
        onClose={handleModalClose}
        onContinue={handleModalContinue}
      />
    </>
  );
};
