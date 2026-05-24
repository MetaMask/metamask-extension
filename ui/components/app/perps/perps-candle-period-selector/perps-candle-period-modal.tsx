import React from 'react';
import {
  Box,
  ButtonBase,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconName,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalContentSize,
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
import { CandlePeriod, CANDLE_PERIODS } from '../constants/chartConfig';
import { isMatchingPeriod } from './perps-candle-period-utils';

type CandlePeriodSection = {
  titleKey: string;
  periods: readonly {
    label: string;
    value: CandlePeriod;
  }[];
};

const CANDLE_PERIOD_MODAL_SECTIONS: CandlePeriodSection[] = [
  {
    titleKey: 'perpsCandlePeriodMinutes',
    periods: CANDLE_PERIODS.filter((period) =>
      [
        CandlePeriod.OneMinute,
        CandlePeriod.ThreeMinutes,
        CandlePeriod.FiveMinutes,
        CandlePeriod.FifteenMinutes,
        CandlePeriod.ThirtyMinutes,
      ].includes(period.value),
    ),
  },
  {
    titleKey: 'perpsCandlePeriodHours',
    periods: CANDLE_PERIODS.filter((period) =>
      [
        CandlePeriod.OneHour,
        CandlePeriod.TwoHours,
        CandlePeriod.FourHours,
        CandlePeriod.EightHours,
        CandlePeriod.TwelveHours,
      ].includes(period.value),
    ),
  },
  {
    titleKey: 'perpsCandlePeriodDays',
    periods: CANDLE_PERIODS.filter((period) =>
      [
        CandlePeriod.OneDay,
        CandlePeriod.ThreeDays,
        CandlePeriod.OneWeek,
        CandlePeriod.OneMonth,
      ].includes(period.value),
    ),
  },
];

export type PerpsCandlePeriodModalProps = {
  isOpen: boolean;
  selectedPeriod: CandlePeriod | string;
  onClose: () => void;
  onPeriodChange?: (period: CandlePeriod) => void;
};

export const PerpsCandlePeriodModal: React.FC<PerpsCandlePeriodModalProps> = ({
  isOpen,
  selectedPeriod,
  onClose,
  onPeriodChange,
}) => {
  const t = useI18nContext();

  const handlePeriodSelect = (period: CandlePeriod) => {
    onPeriodChange?.(period);
    onClose();
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
      data-testid="perps-candle-period-modal"
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
              {t('perpsCandleIntervals')}
            </Text>
            <ButtonIcon
              iconName={IconName.Close}
              ariaLabel={t('close')}
              size={ButtonIconSize.Md}
              onClick={onClose}
              className="absolute right-0 top-1/2 -translate-y-1/2"
            />
          </div>
        </div>

        <Box className="flex flex-col gap-2 px-4 pt-1 pb-5">
          {CANDLE_PERIOD_MODAL_SECTIONS.map((section, sectionIndex) => (
            <Box
              key={section.titleKey}
              className={twMerge(
                'flex flex-col gap-2',
                sectionIndex > 0 && 'pt-5',
              )}
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                fontWeight={FontWeight.Medium}
              >
                {t(section.titleKey)}
              </Text>

              <div className="grid grid-cols-5 gap-2">
                {section.periods.map((period) => {
                  const isSelected = isMatchingPeriod(
                    selectedPeriod,
                    period.value,
                  );

                  return (
                    <ButtonBase
                      key={period.value}
                      className={twMerge(
                        'h-9 min-w-0 rounded-xl bg-muted px-0 py-0 transition-colors hover:bg-muted-hover active:bg-muted-pressed',
                        isSelected &&
                          'bg-icon-default hover:bg-icon-default active:bg-icon-default',
                      )}
                      onClick={() => handlePeriodSelect(period.value)}
                      data-testid={`perps-candle-period-modal-${period.value}`}
                    >
                      <Text
                        variant={TextVariant.BodySm}
                        fontWeight={FontWeight.Medium}
                        className={isSelected ? 'text-icon-inverse' : undefined}
                        color={isSelected ? undefined : TextColor.TextDefault}
                      >
                        {period.label}
                      </Text>
                    </ButtonBase>
                  );
                })}
              </div>
            </Box>
          ))}
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default PerpsCandlePeriodModal;
