import React, { useCallback, useId } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { MONEY_HOME_ROUTE } from '../../../../helpers/constants/routes';
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
import { transitionForward } from '../../../ui/transition';
import { TooltipText } from '../tooltip-text';

export const MONEY_FTUE_SPLASH_TEST_ID = 'money-ftue-splash';
export const MONEY_FTUE_SPLASH_CLOSE_BUTTON_TEST_ID =
  'money-ftue-splash-close-button';
export const MONEY_FTUE_SPLASH_START_EARNING_BUTTON_TEST_ID =
  'money-ftue-splash-start-earning-button';

const MONEY_FTUE_HERO_BACKGROUND = './images/money-ftue-hero-background.svg';
const MONEY_FTUE_HERO_BACKGROUND_CARD =
  './images/money-ftue-hero-background-card.svg';
const MONEY_FTUE_HERO_COINS = './images/money-ftue-hero-coins.png';
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
  const navigate = useNavigate();
  const location = useLocation();
  const titleId = useId();
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

      if (isDeposit && buttonType === MoneyButtonType.Text) {
        initiateDeposit({
          ...(pendingDeposit ?? {}),
          skipFtue: true,
        });
      } else if (
        source === 'moneyHome' &&
        location.pathname !== MONEY_HOME_ROUTE
      ) {
        transitionForward(() => navigate(MONEY_HOME_ROUTE));
      }
    },
    [
      dispatch,
      initiateDeposit,
      isDeposit,
      location.pathname,
      navigate,
      pendingDeposit,
      redirectTarget,
      source,
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

  let contentClassName: string | undefined;
  let dialogClassName: string;

  if (isPopup) {
    contentClassName = 'p-0';
    dialogClassName = 'h-full min-h-0 max-w-none rounded-none border-0';
  } else if (isSidepanel) {
    contentClassName = 'items-center';
    dialogClassName = 'max-h-[min(75vh,680px)] min-h-0 max-w-[368px]';
  } else {
    contentClassName = undefined;
    dialogClassName = 'max-h-[calc(100vh-32px)] min-h-0 max-w-[368px]';
  }

  return (
    <Modal
      isOpen
      onClose={handleClose}
      isClosedOnOutsideClick={false}
      restoreFocus
    >
      {isPopup ? null : (
        <ModalOverlay
          className="bg-black/30"
          data-testid="money-ftue-splash-overlay"
        />
      )}
      <ModalContent
        size={ModalContentSize.Sm}
        className={contentClassName}
        modalDialogProps={{
          'aria-labelledby': titleId,
          className: dialogClassName,
          'data-testid': MONEY_FTUE_SPLASH_TEST_ID,
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-2 py-4 pl-6 pr-4">
            <h2
              id={titleId}
              className="text-default text-s-heading-md leading-s-heading-md font-medium"
              data-testid="money-ftue-splash-title"
            >
              {t('moneyFtueTitle')}
            </h2>
            <ButtonIcon
              iconName={IconName.Close}
              size={ButtonIconSize.Md}
              ariaLabel={t('close')}
              onClick={handleClose}
              data-testid={MONEY_FTUE_SPLASH_CLOSE_BUTTON_TEST_ID}
            />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="px-4 pt-1">
              <div
                className="relative aspect-[16/9] w-full"
                data-testid="money-ftue-splash-artwork"
              >
                <img
                  src={
                    isPopup
                      ? MONEY_FTUE_HERO_BACKGROUND
                      : MONEY_FTUE_HERO_BACKGROUND_CARD
                  }
                  alt=""
                  className="absolute inset-0 h-full w-full"
                />
                <img
                  src={MONEY_FTUE_HERO_COINS}
                  alt=""
                  className="absolute left-1/2 top-1/2 w-[59%] -translate-x-1/2 -translate-y-1/2"
                />
              </div>

              <h2
                className={
                  isPopup
                    ? 'mt-6 text-default text-s-display-md leading-s-display-md font-bold'
                    : 'mt-6 text-default text-s-heading-lg leading-s-heading-lg font-bold'
                }
                data-testid="money-ftue-splash-headline"
              >
                {t('moneyFtueHeadline')}
              </h2>

              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
                className="mt-4"
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
