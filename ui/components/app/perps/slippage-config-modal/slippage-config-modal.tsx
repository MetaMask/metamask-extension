import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalContentSize,
  ModalOverlay,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../../shared/constants/app';
import {
  PERPS_SLIPPAGE_DEFAULT_PCT,
  PERPS_SLIPPAGE_MAX_PCT,
  PERPS_SLIPPAGE_MIN_PCT,
  PERPS_SLIPPAGE_STEP_PCT,
} from '../constants';

export type SlippageConfigModalProps = {
  isOpen: boolean;
  currentValuePct: number;
  onClose: () => void;
  onSave: (valuePct: number) => void;
};

const QUICK_PICK_PCTS = [0.5, 1, 3, 5];

function clampToBounds(value: number): number {
  if (!Number.isFinite(value)) {
    return PERPS_SLIPPAGE_DEFAULT_PCT;
  }
  return Math.min(
    PERPS_SLIPPAGE_MAX_PCT,
    Math.max(PERPS_SLIPPAGE_MIN_PCT, value),
  );
}

// Round to the nearest 0.1 to honor the step contract (AC2).
function snapToStep(value: number): number {
  return Math.round(value / PERPS_SLIPPAGE_STEP_PCT) * PERPS_SLIPPAGE_STEP_PCT;
}

export const SlippageConfigModal: React.FC<SlippageConfigModalProps> = ({
  isOpen,
  currentValuePct,
  onClose,
  onSave,
}) => {
  const t = useI18nContext();
  const [draftValue, setDraftValue] = useState<string>(
    currentValuePct.toString(),
  );
  const savedValueRef = useRef(currentValuePct);

  useEffect(() => {
    if (isOpen) {
      savedValueRef.current = currentValuePct;
      setDraftValue(currentValuePct.toString());
    }
  }, [isOpen, currentValuePct]);

  const parsedDraft = Number.parseFloat(draftValue);
  const draftIsValid =
    Number.isFinite(parsedDraft) &&
    parsedDraft >= PERPS_SLIPPAGE_MIN_PCT &&
    parsedDraft <= PERPS_SLIPPAGE_MAX_PCT;

  const handleSave = () => {
    if (!draftIsValid) {
      return;
    }
    const finalValue = snapToStep(clampToBounds(parsedDraft));
    onSave(finalValue);
    onClose();
  };

  const handleQuickPick = (pct: number) => {
    setDraftValue(pct.toString());
  };

  const environmentType = getEnvironmentType();
  const isCompactSheet =
    environmentType === ENVIRONMENT_TYPE_POPUP ||
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL;

  const modalLayoutProps = isCompactSheet
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
      };

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
        <div className="px-4 pb-4 pt-3">
          <div className="relative flex min-h-8 items-center justify-center">
            <Text
              variant={TextVariant.HeadingSm}
              fontWeight={FontWeight.Bold}
              className="text-center"
            >
              {t('perpsSlippageConfigTitle')}
            </Text>
            <ButtonIcon
              iconName={IconName.Close}
              ariaLabel={t('close')}
              size={ButtonIconSize.Md}
              onClick={onClose}
              data-testid="perps-slippage-config-close"
              className="absolute right-0 top-1/2 -translate-y-1/2"
            />
          </div>
        </div>

        <Box className="flex flex-col gap-3 px-4 pb-5">
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsSlippageConfigDescription')}
          </Text>

          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              min={PERPS_SLIPPAGE_MIN_PCT}
              max={PERPS_SLIPPAGE_MAX_PCT}
              step={PERPS_SLIPPAGE_STEP_PCT}
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              data-testid="perps-slippage-config-input"
              aria-label={t('perpsSlippageConfigInputLabel')}
              className="h-12 w-full rounded-xl border border-muted bg-default px-4 pr-10 text-right text-base text-default focus:border-icon-default focus:outline-none"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base text-alternative"
            >
              %
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {QUICK_PICK_PCTS.map((pct) => {
              const isSelected =
                draftIsValid &&
                Math.abs(parsedDraft - pct) < PERPS_SLIPPAGE_STEP_PCT / 2;
              return (
                <Button
                  key={pct}
                  type="button"
                  variant={
                    isSelected ? ButtonVariant.Primary : ButtonVariant.Secondary
                  }
                  size={ButtonSize.Sm}
                  onClick={() => handleQuickPick(pct)}
                  data-testid={`perps-slippage-config-preset-${pct}`}
                >{`${pct}%`}</Button>
              );
            })}
          </div>

          {!draftIsValid && (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.ErrorDefault}
              data-testid="perps-slippage-config-error"
            >
              {t('perpsSlippageConfigOutOfRange', [
                `${PERPS_SLIPPAGE_MIN_PCT}`,
                `${PERPS_SLIPPAGE_MAX_PCT}`,
              ])}
            </Text>
          )}

          <Button
            type="button"
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            disabled={!draftIsValid}
            onClick={handleSave}
            data-testid="perps-slippage-config-save"
            className="w-full"
          >
            {t('save')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default SlippageConfigModal;
