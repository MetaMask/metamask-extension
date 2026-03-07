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
  isExpanded: boolean;
  isPerpsInAppToastsEnabled?: boolean;
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
 * @param options0.isExpanded
 * @param options0.isPerpsInAppToastsEnabled
 * @param options0.onToggle
 */
export const EditMarginExpandable: React.FC<EditMarginExpandableProps> = ({
  position,
  account,
  currentPrice,
  isExpanded,
  isPerpsInAppToastsEnabled = true,
  onToggle,
}) => {
  const t = useI18nContext();
  const [marginMode, setMarginMode] = useState<'add' | 'remove'>('add');
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = useCallback(() => {
    onToggle();
  }, [onToggle]);

  const handleSetMode = useCallback(
    (mode: 'add' | 'remove') => {
      if (isSaving) {
        return;
      }
      setMarginMode(mode);
    },
    [isSaving],
  );

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
                onClick={() => handleSetMode('add')}
                className={twMerge(
                  'flex-1 py-2 rounded-lg text-center transition-colors',
                  isSaving
                    ? 'cursor-not-allowed pointer-events-none opacity-50'
                    : 'cursor-pointer',
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
                onClick={() => handleSetMode('remove')}
                className={twMerge(
                  'flex-1 py-2 rounded-lg text-center transition-colors',
                  isSaving
                    ? 'cursor-not-allowed pointer-events-none opacity-50'
                    : 'cursor-pointer',
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

            {/*
             * key={marginMode} unmounts and remounts EditMarginModalContent on mode
             * switch, which resets all internal state (amount, error) to defaults.
             */}
            <EditMarginModalContent
              key={marginMode}
              position={position}
              account={account}
              currentPrice={currentPrice}
              mode={marginMode}
              isPerpsInAppToastsEnabled={isPerpsInAppToastsEnabled}
              onClose={handleClose}
              onSavingChange={setIsSaving}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
