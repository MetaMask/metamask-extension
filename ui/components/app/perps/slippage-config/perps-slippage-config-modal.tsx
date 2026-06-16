import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalContentSize,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../../shared/constants/app';
import {
  PERPS_SLIPPAGE_MAX_BPS,
  PERPS_SLIPPAGE_MIN_BPS,
  PERPS_SLIPPAGE_QUICK_PICKS_BPS,
  PERPS_SLIPPAGE_STEP_BPS,
  bpsToPercent,
  percentToBps,
} from '../constants/slippageConfig';

const MIN_PCT = bpsToPercent(PERPS_SLIPPAGE_MIN_BPS);
const MAX_PCT = bpsToPercent(PERPS_SLIPPAGE_MAX_BPS);

const PRESET_CHIP_CLASS =
  'shrink-0 min-w-[4.25rem] py-2.5 px-3 rounded-xl text-center cursor-pointer transition-colors duration-150';
/** Fixed footprint so the Custom chip and inline editor stay the same size. */
const CUSTOM_SLOT_CLASS =
  'flex h-[2.75rem] w-[5.75rem] shrink-0 items-center justify-center rounded-xl';
const CHIP_SELECTED_CLASS = 'bg-default text-default';
const CHIP_UNSELECTED_CLASS =
  'bg-muted text-alternative hover:bg-muted-hover active:bg-muted-pressed';

function matchesPreset(bps: number): boolean {
  return PERPS_SLIPPAGE_QUICK_PICKS_BPS.includes(bps);
}

function snapToStep(pct: number): number {
  const snappedBps =
    Math.round(percentToBps(pct) / PERPS_SLIPPAGE_STEP_BPS) *
    PERPS_SLIPPAGE_STEP_BPS;
  return bpsToPercent(snappedBps);
}

function clampToRange(pct: number): number {
  return Math.min(MAX_PCT, Math.max(MIN_PCT, pct));
}

export type PerpsSlippageConfigModalProps = {
  isOpen: boolean;
  currentValueBps: number;
  onClose: () => void;
  onSave: (valueBps: number) => void | Promise<void>;
};

export const PerpsSlippageConfigModal = ({
  isOpen,
  currentValueBps,
  onClose,
  onSave,
}: PerpsSlippageConfigModalProps) => {
  const t = useI18nContext();
  const customInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedBps, setSelectedBps] = useState(currentValueBps);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [draftValue, setDraftValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      const startsAsCustom = !matchesPreset(currentValueBps);
      setSelectedBps(currentValueBps);
      setIsCustomMode(startsAsCustom);
      setDraftValue(
        startsAsCustom ? bpsToPercent(currentValueBps).toString() : '',
      );
    }
  }, [isOpen, currentValueBps]);

  useEffect(() => {
    if (isOpen && isCustomMode) {
      customInputRef.current?.focus();
      customInputRef.current?.select();
    }
  }, [isOpen, isCustomMode]);

  const trimmedDraft = draftValue.trim();
  const parsedDraft = Number.parseFloat(trimmedDraft);
  const draftIsEmpty = trimmedDraft === '' || trimmedDraft === '.';
  // Require the entire value to be a single numeric token so partial/invalid
  // strings like '1abc' or '1.2.3' are rejected instead of silently truncated
  // by parseFloat.
  const draftIsNumeric = /^(?:\d+\.?\d*|\.\d+)$/u.test(trimmedDraft);
  const draftIsInRange =
    draftIsNumeric &&
    Number.isFinite(parsedDraft) &&
    parsedDraft >= MIN_PCT &&
    parsedDraft <= MAX_PCT;
  const showCustomError = isCustomMode && !draftIsEmpty && !draftIsInRange;

  const canSet = isCustomMode ? draftIsInRange : true;

  const handlePresetPress = useCallback((bps: number) => {
    setIsCustomMode(false);
    setSelectedBps(bps);
    setDraftValue('');
  }, []);

  const handleOpenCustom = useCallback(() => {
    setIsCustomMode(true);
    setDraftValue(
      matchesPreset(selectedBps) ? '' : bpsToPercent(selectedBps).toString(),
    );
  }, [selectedBps]);

  const handleSet = useCallback(async () => {
    if (!canSet) {
      return;
    }
    const valueBps = isCustomMode
      ? percentToBps(snapToStep(clampToRange(parsedDraft)))
      : selectedBps;
    try {
      await onSave(valueBps);
      onClose();
    } catch {
      // Persist failed — keep the modal open so the user can retry.
    }
  }, [canSet, isCustomMode, onClose, onSave, parsedDraft, selectedBps]);

  const environmentType = getEnvironmentType();
  const isCompactSheet =
    environmentType === ENVIRONMENT_TYPE_POPUP ||
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL;

  const modalLayoutProps = useMemo(
    () =>
      isCompactSheet
        ? {
            justifyContent: JustifyContent.flexEnd,
            alignItems: AlignItems.stretch,
            dialogStyle: {
              marginTop: 'auto',
              width: '100%',
              maxWidth: '100%',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
            },
          }
        : {
            justifyContent: JustifyContent.center,
            alignItems: AlignItems.center,
            dialogStyle: {
              width: '100%',
              maxWidth: '360px',
              borderRadius: '20px',
            },
          },
    [isCompactSheet],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="perps-slippage-config-modal"
    >
      <ModalOverlay />
      <ModalContent
        size={ModalContentSize.Sm}
        display={Display.Flex}
        justifyContent={modalLayoutProps.justifyContent}
        alignItems={modalLayoutProps.alignItems}
        padding={0}
        modalDialogProps={{
          padding: 0,
          style: modalLayoutProps.dialogStyle,
        }}
      >
        <ModalHeader onClose={onClose}>
          {t('perpsSlippageConfigTitle')}
        </ModalHeader>

        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={4}
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={4}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsSlippageConfigDescription')}
          </Text>

          <Box flexDirection={BoxFlexDirection.Row} className="w-full gap-2">
            {PERPS_SLIPPAGE_QUICK_PICKS_BPS.map((bps) => {
              const pct = bpsToPercent(bps);
              const isSelected = !isCustomMode && selectedBps === bps;
              return (
                <button
                  key={bps}
                  type="button"
                  onClick={() => handlePresetPress(bps)}
                  data-testid={`perps-slippage-config-preset-${pct}`}
                  className={twMerge(
                    PRESET_CHIP_CLASS,
                    isSelected ? CHIP_SELECTED_CLASS : CHIP_UNSELECTED_CLASS,
                  )}
                >
                  <Text
                    variant={TextVariant.BodyMd}
                    color={
                      isSelected
                        ? TextColor.TextDefault
                        : TextColor.TextAlternative
                    }
                    className="font-medium"
                  >
                    {`${pct}%`}
                  </Text>
                </button>
              );
            })}

            <Box
              className={twMerge(
                CUSTOM_SLOT_CLASS,
                isCustomMode
                  ? 'cursor-text gap-1 border border-primary-default bg-default px-2'
                  : CHIP_UNSELECTED_CLASS,
              )}
              data-testid="perps-slippage-config-custom-display"
            >
              {isCustomMode ? (
                <>
                  <input
                    ref={customInputRef}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    value={draftValue}
                    onChange={(event) => setDraftValue(event.target.value)}
                    onFocus={(event) => event.target.select()}
                    data-testid="perps-slippage-config-custom-input"
                    aria-label={t('perpsSlippageInputLabel')}
                    className="min-w-0 flex-1 border-0 bg-transparent text-center text-default outline-none"
                  />
                  <Text
                    variant={TextVariant.BodyMd}
                    color={TextColor.TextDefault}
                    className="shrink-0 font-medium"
                  >
                    %
                  </Text>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCustom}
                  data-testid="perps-slippage-config-edit"
                  className="flex h-full w-full cursor-pointer items-center justify-center border-0 bg-transparent p-0"
                >
                  <Text
                    variant={TextVariant.BodyMd}
                    color={TextColor.TextAlternative}
                    className="font-medium"
                  >
                    {t('perpsSlippageCustom')}
                  </Text>
                </button>
              )}
            </Box>
          </Box>

          {showCustomError && (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.ErrorDefault}
              data-testid="perps-slippage-config-custom-error"
            >
              {t('perpsSlippageOutOfRange', [`${MIN_PCT}`, `${MAX_PCT}`])}
            </Text>
          )}
        </Box>

        <ModalFooter>
          <Button
            type="button"
            size={ButtonSize.Lg}
            variant={ButtonVariant.Primary}
            onClick={handleSet}
            disabled={!canSet}
            data-testid="perps-slippage-config-set"
            className="w-full"
          >
            {t('perpsSlippageSet')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PerpsSlippageConfigModal;
