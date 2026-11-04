import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Modal,
  ModalContent,
  ModalContentSize,
  ModalOverlay,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import {
  closeMoneyFtue,
  selectIsMoneyFtueOpen,
  selectMoneyFtuePendingDeposit,
  selectMoneyFtueSource,
} from '../../../../ducks/money-ftue';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTrackOnce } from '../../../../hooks/useTrackOnce';
import { useMoneyAccountDeposit } from '../../../../hooks/money/useMoneyAccountDeposit';
import { useMoneyAnalytics } from '../../../../hooks/money/useMoneyAnalytics';
import { useMoneyVaultApy } from '../../../../hooks/money/useMoneyVaultApy';
import { setMoneyFtueSeen } from '../../../../store/actions';
import { useDispatch } from '../../../../store/hooks';
import { MoneyFaqItem } from '../../../../pages/money/components/money-faq-item';
import { MONEY_FAQ_ITEMS } from '../../../../pages/money/constants/money-faqs';
import {
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
} from '../../../../pages/money/constants/money-events';
import { PopoverPosition } from '../../../component-library';
import { TooltipText } from '../tooltip-text';

export const MONEY_FTUE_SPLASH_TEST_ID = 'money-ftue-splash';
export const MONEY_FTUE_SPLASH_CLOSE_BUTTON_TEST_ID =
  'money-ftue-splash-close-button';
export const MONEY_FTUE_SPLASH_START_EARNING_BUTTON_TEST_ID =
  'money-ftue-splash-start-earning-button';

const MONEY_FTUE_ARTWORK = './images/money-onboarding-stepper-step-1.png';
const APY_FALLBACK = '—';

const BENEFITS = [
  {
    id: 'convert',
    titleKey: 'moneyFtueBenefitConvertTitle',
    descriptionKey: 'moneyFtueBenefitConvertDescription',
  },
  {
    id: 'earn',
    titleKey: 'moneyFtueBenefitEarnTitle',
    descriptionKey: 'moneyFtueBenefitEarnDescription',
  },
  {
    id: 'trade',
    titleKey: 'moneyFtueBenefitTradeTitle',
    descriptionKey: 'moneyFtueBenefitTradeDescription',
  },
  {
    id: 'withdraw',
    titleKey: 'moneyFtueBenefitWithdrawTitle',
    descriptionKey: 'moneyFtueBenefitWithdrawDescription',
  },
  {
    id: 'spend',
    titleKey: 'moneyFtueBenefitSpendTitle',
    descriptionKey: 'moneyFtueBenefitSpendDescription',
  },
] as const;

const MoneyFtueSplashContent = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const source = useSelector(selectMoneyFtueSource);
  const pendingDeposit = useSelector(selectMoneyFtuePendingDeposit);
  const { apyPercentFormatted } = useMoneyVaultApy({ enabled: true });
  const { initiateDeposit } = useMoneyAccountDeposit();
  const { trackButtonClicked, trackScreenViewed } = useMoneyAnalytics({
    screenName: MoneyScreenName.MoneyFtue,
    componentName: MoneyComponentName.FtueSplash,
  });

  useTrackOnce(true, trackScreenViewed);

  const apyDisplay = apyPercentFormatted ?? APY_FALLBACK;
  const isDeposit = source === 'deposit';
  const redirectTarget = isDeposit
    ? MoneyScreenName.MoneyDeposit
    : MoneyScreenName.MoneyHome;

  const continueSplash = useCallback(
    (buttonType: MoneyButtonType) => {
      if (buttonType === MoneyButtonType.Text) {
        trackButtonClicked({
          buttonType,
          buttonIntent: MoneyButtonIntent.AddMoney,
          componentName: MoneyComponentName.FtueSplash,
          labelKey: 'moneyFtueStartEarning',
          redirectTarget,
        });
      } else {
        trackButtonClicked({
          buttonType,
          buttonIntent: MoneyButtonIntent.Dismiss,
          componentName: MoneyComponentName.FtueSplash,
          redirectTarget,
        });
      }

      dispatch(setMoneyFtueSeen(true));
      dispatch(closeMoneyFtue());

      if (isDeposit) {
        initiateDeposit({
          ...(pendingDeposit ?? {}),
          skipFtue: true,
        });
      }
    },
    [
      dispatch,
      initiateDeposit,
      isDeposit,
      pendingDeposit,
      redirectTarget,
      trackButtonClicked,
    ],
  );

  const handleStartEarning = useCallback(
    () => continueSplash(MoneyButtonType.Text),
    [continueSplash],
  );
  const handleClose = useCallback(
    () => continueSplash(MoneyButtonType.Icon),
    [continueSplash],
  );

  const environmentType = getEnvironmentType();
  const isPopup = environmentType === ENVIRONMENT_TYPE_POPUP;
  const isSidepanel = environmentType === ENVIRONMENT_TYPE_SIDEPANEL;

  return (
    <Modal
      isOpen
      onClose={handleClose}
      isClosedOnOutsideClick={false}
      restoreFocus
    >
      {isPopup ? null : (
        <ModalOverlay className={isSidepanel ? 'bg-transparent' : undefined} />
      )}
      <ModalContent
        size={ModalContentSize.Sm}
        className={isPopup ? 'p-0' : undefined}
        modalDialogProps={{
          className: isPopup
            ? 'h-full min-h-0 max-w-none rounded-none border-0'
            : 'max-h-[calc(100vh-32px)] min-h-0 max-w-[400px]',
          'data-testid': MONEY_FTUE_SPLASH_TEST_ID,
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-2 px-4 py-2">
            <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Bold}>
              {t('moneyFtueTitle')}
            </Text>
            <ButtonIcon
              iconName={IconName.Close}
              size={ButtonIconSize.Md}
              ariaLabel={t('close')}
              onClick={handleClose}
              data-testid={MONEY_FTUE_SPLASH_CLOSE_BUTTON_TEST_ID}
            />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="px-4 pt-2">
              <img
                src={MONEY_FTUE_ARTWORK}
                alt=""
                className="aspect-[16/9] w-full rounded-2xl object-cover"
                data-testid="money-ftue-splash-artwork"
              />

              <Text
                variant={TextVariant.HeadingLg}
                fontWeight={FontWeight.Bold}
                className="mt-5"
                data-testid="money-ftue-splash-headline"
              >
                {t('moneyFtueHeadline')}
              </Text>

              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
                className="mt-3"
                data-testid="money-ftue-splash-description"
              >
                {t('moneyFtueDescription', [
                  <TooltipText
                    key="apy"
                    text={apyDisplay}
                    variant={TextVariant.BodyMd}
                    className="text-success-default"
                    position={PopoverPosition.Auto}
                    popoverStyle={{ maxWidth: 315 }}
                    data-testid="money-ftue-splash-apy"
                  >
                    <div className="flex flex-col gap-4">
                      <Text variant={TextVariant.BodyMd}>
                        {t('moneyHomeApyTooltipEarning', [apyDisplay])}
                      </Text>
                      <Text variant={TextVariant.BodyMd}>
                        {t('moneyHomeApyTooltip')}
                      </Text>
                      <Text variant={TextVariant.BodyMd}>
                        {t('moneyHomeApyTooltipPoweredBy')}
                      </Text>
                    </div>
                  </TooltipText>,
                ])}
              </Text>

              <ul className="mt-5 flex flex-col gap-4">
                {BENEFITS.map((benefit) => (
                  <li
                    key={benefit.id}
                    className="flex items-start gap-3"
                    data-testid={`money-ftue-splash-benefit-${benefit.id}`}
                  >
                    <Icon
                      name={IconName.Check}
                      size={IconSize.Md}
                      color={IconColor.SuccessDefault}
                      className="mt-0.5 shrink-0"
                    />
                    <div>
                      <Text
                        variant={TextVariant.BodyMd}
                        fontWeight={FontWeight.Bold}
                      >
                        {t(benefit.titleKey)}
                      </Text>
                      <Text
                        variant={TextVariant.BodySm}
                        color={TextColor.TextAlternative}
                        className="mt-1"
                      >
                        {t(benefit.descriptionKey)}
                      </Text>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <section className="mt-8">
              <Text
                variant={TextVariant.HeadingMd}
                fontWeight={FontWeight.Bold}
                className="px-4 pb-2"
                data-testid="money-ftue-splash-faq-title"
              >
                {t('moneyHowItWorksFaqTitle')}
              </Text>
              {MONEY_FAQ_ITEMS.map((item) => {
                const answer = t(
                  item.answerKey,
                  item.usesApy ? [apyDisplay] : item.substitutions,
                );

                return (
                  <MoneyFaqItem
                    key={item.id}
                    question={t(item.questionKey)}
                    answer={answer}
                    testId={`money-ftue-splash-faq-${item.id}`}
                  />
                );
              })}
            </section>
          </div>

          <footer className="p-4">
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={handleStartEarning}
              data-testid={MONEY_FTUE_SPLASH_START_EARNING_BUTTON_TEST_ID}
            >
              {t('moneyFtueStartEarning')}
            </Button>
          </footer>
        </div>
      </ModalContent>
    </Modal>
  );
};

/**
 * The Money account first-time-user splash. Mounted once globally; it renders
 * nothing until the FTUE slice opens it.
 */
export function MoneyFtueSplash() {
  const isOpen = useSelector(selectIsMoneyFtueOpen);

  return isOpen ? <MoneyFtueSplashContent /> : null;
}

export default MoneyFtueSplash;
