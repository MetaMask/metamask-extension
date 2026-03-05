import React, { useState, useCallback } from 'react';
import {
  twMerge,
  Box,
  BoxFlexDirection,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import type { Position, AccountState } from '../types';
import { EditMarginModalContent } from './edit-margin-modal-content';

export type EditMarginExpandableProps = {
  position: Position;
  account: AccountState | null;
  currentPrice: number;
  selectedAddress: string;
  isExpanded: boolean;
  onToggle: () => void;
};

/**
 * Expandable section for adding or removing margin from an isolated position.
 * Renders the expandable content only; the margin card header lives in the parent.
 * Uses EditMarginModalContent with a mode toggle for add/remove.
 * @param options0
 * @param options0.position
 * @param options0.account
 * @param options0.currentPrice
 * @param options0.selectedAddress
 * @param options0.isExpanded
 * @param options0.onToggle
 */
export const EditMarginExpandable: React.FC<EditMarginExpandableProps> = ({
  position,
  account,
  currentPrice,
  selectedAddress,
  isExpanded,
  onToggle,
}) => {
  const t = useI18nContext();
  const [marginMode, setMarginMode] = useState<'add' | 'remove'>('add');

  const handleClose = useCallback(() => {
    onToggle();
  }, [onToggle]);

  return (
    <Box
      className="rounded-xl bg-muted overflow-hidden"
      flexDirection={BoxFlexDirection.Column}
    >
      <Box
        className={twMerge(
          'grid transition-all duration-300 ease-in-out',
          isExpanded
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <Box
          className="overflow-hidden"
          flexDirection={BoxFlexDirection.Column}
        >
          <Box
            className="px-4 py-3"
            flexDirection={BoxFlexDirection.Column}
            gap={4}
          >
            {/* Mode toggle: Add / Remove */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              className="w-full bg-background-default rounded-xl p-1 gap-1"
            >
              <Box
                onClick={() => setMarginMode('add')}
                className={twMerge(
                  'flex-1 py-2 rounded-lg text-center cursor-pointer transition-colors',
                  marginMode === 'add'
                    ? 'bg-primary-default'
                    : 'hover:bg-muted-hover active:bg-muted-pressed',
                )}
              >
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={
                    marginMode === 'add'
                      ? TextColor.PrimaryInverse
                      : TextColor.TextDefault
                  }
                >
                  {t('perpsAddMargin')}
                </Text>
              </Box>
              <Box
                onClick={() => setMarginMode('remove')}
                className={twMerge(
                  'flex-1 py-2 rounded-lg text-center cursor-pointer transition-colors',
                  marginMode === 'remove'
                    ? 'bg-primary-default'
                    : 'hover:bg-muted-hover active:bg-muted-pressed',
                )}
              >
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={
                    marginMode === 'remove'
                      ? TextColor.PrimaryInverse
                      : TextColor.TextDefault
                  }
                >
                  {t('perpsRemoveMargin')}
                </Text>
              </Box>
            </Box>

            <EditMarginModalContent
              position={position}
              account={account}
              currentPrice={currentPrice}
              selectedAddress={selectedAddress}
              mode={marginMode}
              onClose={handleClose}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
