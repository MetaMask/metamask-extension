import React, {  useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  FontWeight,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { RewardsIcon, RewardsIconVariant } from './RewardsIcon';
import { CaipAccountId } from '@metamask/utils';
import { submitRequestToBackground } from '../../../store/background-connection';
import { forceUpdateMetamaskState } from '../../../store/actions';
import { MetaMaskReduxDispatch } from '../../../store/store';
import { VipFeesResponseDto } from '../../../../app/scripts/controllers/rewards/rewards-controller.types';

export const RewardsVipTag = ({
  accountId,
}: {
  accountId: CaipAccountId ;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
const [vipTier, setVipTier] = useState<number | 0>(0);

  useEffect(() => {
    dispatch(async (dispatch: MetaMaskReduxDispatch) => {
      const vipFees = (await submitRequestToBackground('rewardsGetVipFeesForAccount', [accountId]) as VipFeesResponseDto | 0)
      await forceUpdateMetamaskState(dispatch);
      if (! vipFees) {
        setVipTier(0);
      }else{
      setVipTier( vipFees.vipTier);}
    });
  }, [accountId, dispatch]);

  if (!vipTier) {
    return null;
  }

  return (
    <Box
      className={'w-max rounded-md bg-gradient-to-r from-[#ECB920] to-[65%] to-[#ECBC2D]/[11%] p-[1px] border-1'}
      data-testid="rewards-vip-badge"
    >
      <Box className="w-max flex flex-row rounded-md bg-warning-inverse">
        <Box className="w-max flex flex-row rounded-md whitespace-nowrap px-2 py-0 gap-1 bg-[#ECBC2D]/[11%]">
        <RewardsIcon variant={RewardsIconVariant.Vip} size={14} />
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
        >
          {t('vip', [vipTier])}
          </Text>
          </Box>
      </Box>
    </Box>
  );
};
