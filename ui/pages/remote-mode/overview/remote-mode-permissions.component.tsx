import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';

import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import Card from '../../../components/ui/card';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
  FontWeight,
} from '../../../helpers/constants/design-system';

import {
  RemoteModeDailyAllowanceCard,
  RemoteModeSwapAllowanceCard,
  RevokeWithdrawlConfirm,
} from '../components';

import { getSelectedInternalAccount } from '../../../selectors';
import {
  listDelegationEntries,
  type DelegationState,
} from '../../../selectors/delegation';
import { RevokeWithdrawlConfirmModalType } from '../components/revoke-withdrawl-confirm-modal';
import { useRemoteMode } from '../hooks/useRemoteMode';
import { REMOTE_MODES } from '../remote.types';
import {
  REMOTE_ROUTE_SETUP_SWAPS,
  REMOTE_ROUTE_SETUP_DAILY_ALLOWANCE,
} from '../../../helpers/constants/routes';
import { getDelegationHashOffchain } from '../../../../shared/lib/delegation/delegation';

export default function RemoteModePermissions({
  setStartEnableRemoteSwap,
  setStartEnableDailyAllowance,
}: {
  setStartEnableRemoteSwap?: (startEnableRemoteSwap: boolean) => void;
  setStartEnableDailyAllowance?: (startEnableDailyAllowance: boolean) => void;
}) {
  const [isAllowancesExpanded, setIsAllowancesExpanded] = useState(false);
  const [isDailyAllowanceExpanded, setIsDailyAllowanceExpanded] =
    useState(false);
  const [isRevokeWithdrawlConfirmVisible, setIsRevokeWithdrawlConfirmVisible] =
    useState(false);
  const [isRevokeSpendAllowanceVisible, setIsRevokeSpendAllowanceVisible] =
    useState(false);
  const [delegationHashSwap, setDelegationHashSwap] = useState<string>('');
  const [delegationHashDailyAllowance, setDelegationHashDailyAllowance] =
    useState<string>('');

  const history = useHistory();

  const selectedAccount = useSelector(getSelectedInternalAccount);
  const entries = useSelector((state) =>
    listDelegationEntries(state as DelegationState, {
      filter: { from: selectedAccount.address as Hex },
    }),
  );

  const {
    disableRemoteMode,
    remoteModeConfig: { swapAllowance, dailyAllowance },
  } = useRemoteMode({
    account: selectedAccount.address as `0x${string}`,
  });

  useEffect(() => {
    async function fetchDelegations() {
      for (const entry of entries) {
        switch (entry.tags[0]) {
          case REMOTE_MODES.SWAP: {
            const swapHash = getDelegationHashOffchain(entry.delegation);
            setDelegationHashSwap(swapHash);
            break;
          }
          case REMOTE_MODES.DAILY_ALLOWANCE: {
            const dailyAllowanceHash = getDelegationHashOffchain(
              entry.delegation,
            );
            setDelegationHashDailyAllowance(dailyAllowanceHash);
            break;
          }
          default:
            // no action needed for other tags (yet)
            break;
        }
      }
    }
    fetchDelegations();
  }, [entries]);

  const handleEnableRemoteSwap = () => {
    if (setStartEnableRemoteSwap) {
      setStartEnableRemoteSwap(true);
    }
  };

  const handleEnableDailyAllowance = () => {
    if (setStartEnableDailyAllowance) {
      setStartEnableDailyAllowance(true);
    }
  };

  const handleRevokeRemoteSwap = async () => {
    // todo: handoff to the confirmation screen (when available)
    setIsRevokeWithdrawlConfirmVisible(false);

    await disableRemoteMode({
      mode: REMOTE_MODES.SWAP,
    });
  };

  const handleRevokeDailyAllowance = async () => {
    // todo: handoff to the confirmation screen (when available)
    setIsRevokeSpendAllowanceVisible(false);

    await disableRemoteMode({
      mode: REMOTE_MODES.DAILY_ALLOWANCE,
    });
  };

  return (
    <Box>
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternativeSoft}>
        Remote Mode lets you use your hardware wallet without plugging it in.{' '}
      </Text>
      <Box paddingTop={2} paddingBottom={2}>
        <Card backgroundColor={BackgroundColor.backgroundMuted}>
          <Box
            display={Display.Flex}
            gap={2}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text fontWeight={FontWeight.Bold}>Remote Swaps</Text>
            {swapAllowance ? (
              <Box display={Display.Flex} gap={4}>
                <Text
                  color={TextColor.infoDefault}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    history.push({
                      pathname: REMOTE_ROUTE_SETUP_SWAPS,
                      search: `?delegationHash=${delegationHashSwap}`,
                    });
                  }}
                >
                  Update
                </Text>
                <Text
                  color={TextColor.errorDefault}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsRevokeWithdrawlConfirmVisible(true)}
                >
                  Revoke
                </Text>
              </Box>
            ) : (
              <Text
                color={TextColor.infoDefault}
                style={{ cursor: 'pointer' }}
                onClick={handleEnableRemoteSwap}
              >
                Turn on
              </Text>
            )}
          </Box>
          {swapAllowance ? (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={4}
              paddingTop={2}
            >
              <Box
                borderColor={BorderColor.borderMuted}
                width={BlockSize.Full}
                style={{ height: '1px', borderBottomWidth: 0 }}
                marginTop={2}
              />
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                gap={2}
              >
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Authorized
                </Text>
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Account #1
                </Text>
              </Box>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                gap={2}
              >
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Networks
                </Text>
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Ethereum Mainnet
                </Text>
              </Box>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                gap={2}
              >
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Available on
                </Text>
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  MetaMask Swaps
                </Text>
              </Box>
              <Box
                borderColor={BorderColor.borderMuted}
                width={BlockSize.Full}
                style={{ height: '1px', borderBottomWidth: 0 }}
                marginTop={2}
              />
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                alignItems={AlignItems.center}
                onClick={() => setIsAllowancesExpanded(!isAllowancesExpanded)}
                style={{ cursor: 'pointer' }}
              >
                <Text color={TextColor.infoDefault}>
                  {swapAllowance.allowances.length} token
                  {swapAllowance.allowances.length === 1 ? '' : 's'} enabled
                </Text>
                <Text>
                  {isAllowancesExpanded ? (
                    <Icon name={IconName.ArrowUp} size={IconSize.Sm} />
                  ) : (
                    <Icon name={IconName.ArrowDown} size={IconSize.Sm} />
                  )}
                </Text>
              </Box>
              {isAllowancesExpanded && (
                <Box>
                  {swapAllowance.allowances.map((allowance) => (
                    <RemoteModeSwapAllowanceCard
                      key={allowance.from}
                      swapAllowance={allowance}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Text color={TextColor.textAlternativeSoft}>
              Allow your MetaMask account to trade with hardware funds via
              MetaMask Swaps. Allowances can only be used to swap.
            </Text>
          )}
        </Card>
      </Box>
      <Box paddingTop={2} paddingBottom={2}>
        <Card backgroundColor={BackgroundColor.backgroundMuted}>
          <Box
            display={Display.Flex}
            gap={2}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text fontWeight={FontWeight.Bold}>Withdrawal limit</Text>
            {dailyAllowance ? (
              <Box display={Display.Flex} gap={4}>
                <Text
                  color={TextColor.infoDefault}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    history.push({
                      pathname: REMOTE_ROUTE_SETUP_DAILY_ALLOWANCE,
                      search: `?delegationHash=${delegationHashDailyAllowance}`,
                    });
                  }}
                >
                  Update
                </Text>
                <Text
                  color={TextColor.errorDefault}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsRevokeSpendAllowanceVisible(true)}
                >
                  Revoke
                </Text>
              </Box>
            ) : (
              <Text
                color={TextColor.infoDefault}
                style={{ cursor: 'pointer' }}
                onClick={handleEnableDailyAllowance}
              >
                Turn on
              </Text>
            )}
          </Box>
          {dailyAllowance ? (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={4}
              paddingTop={2}
            >
              <Box
                borderColor={BorderColor.borderMuted}
                width={BlockSize.Full}
                style={{ height: '1px', borderBottomWidth: 0 }}
                marginTop={2}
              />
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                gap={2}
              >
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Authorized
                </Text>
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Account #1
                </Text>
              </Box>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                gap={2}
              >
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Networks
                </Text>
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Ethereum Mainnet
                </Text>
              </Box>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                gap={2}
              >
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  Available on
                </Text>
                <Text variant={TextVariant.bodyMd} color={TextColor.textMuted}>
                  MetaMask Swaps
                </Text>
              </Box>
              <Box
                borderColor={BorderColor.borderMuted}
                width={BlockSize.Full}
                style={{ height: '1px', borderBottomWidth: 0 }}
                marginTop={2}
              />
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                alignItems={AlignItems.center}
                onClick={() =>
                  setIsDailyAllowanceExpanded(!isDailyAllowanceExpanded)
                }
                style={{ cursor: 'pointer' }}
              >
                <Text color={TextColor.infoDefault}>
                  {dailyAllowance.allowances.length} token
                  {dailyAllowance.allowances.length === 1 ? '' : 's'} enabled
                </Text>
                <Text>
                  {isDailyAllowanceExpanded ? (
                    <Icon name={IconName.ArrowUp} size={IconSize.Sm} />
                  ) : (
                    <Icon name={IconName.ArrowDown} size={IconSize.Sm} />
                  )}
                </Text>
              </Box>
              {isDailyAllowanceExpanded && (
                <Box>
                  {dailyAllowance.allowances.map((allowance) => (
                    <RemoteModeDailyAllowanceCard
                      key={allowance.tokenType}
                      dailyAllowance={allowance}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Text color={TextColor.textAlternativeSoft}>
              Allow your MetaMask account to withdraw from hardware funds up to
              the daily limit.
            </Text>
          )}
        </Card>
        <RevokeWithdrawlConfirm
          visible={isRevokeWithdrawlConfirmVisible}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onConfirm={handleRevokeRemoteSwap}
          onClose={() => setIsRevokeWithdrawlConfirmVisible(false)}
          type={RevokeWithdrawlConfirmModalType.Swap}
        />
        <RevokeWithdrawlConfirm
          visible={isRevokeSpendAllowanceVisible}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onConfirm={handleRevokeDailyAllowance}
          onClose={() => setIsRevokeSpendAllowanceVisible(false)}
          type={RevokeWithdrawlConfirmModalType.Spend}
        />
      </Box>
    </Box>
  );
}
