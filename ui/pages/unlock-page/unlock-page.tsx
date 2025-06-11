import { EventEmitter } from 'events';
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  Text,
  Button,
  ButtonVariant,
  ButtonSize,
  TextColor,
  TextVariant,
  FontWeight,
  Box,
  BoxJustifyContent,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask-previews/design-system-react';
import {
  FormTextField,
  TextFieldType,
} from '../../components/component-library';
import Mascot from '../../components/ui/mascot';
import {
  DEFAULT_ROUTE,
  RESTORE_VAULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
import { isFlask, isBeta } from '../../helpers/utils/build-types';
import {
  tryUnlockMetamask,
  markPasswordForgotten,
  forceUpdateMetamaskState,
} from '../../store/actions';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import { useI18nContext } from '../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { getCaretCoordinates } from './unlock-page.util';

type UnlockPageProps = {
  onSubmit?: (password: string) => Promise<void>;
};

type RootState = {
  metamask: {
    isUnlocked: boolean;
  };
};

const UnlockPage: React.FC<UnlockPageProps> = ({
  onSubmit: customOnSubmit,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const failedAttemptsRef = useRef(0);
  const animationEventEmitterRef = useRef(new EventEmitter());

  const history = useHistory();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const isUnlocked = useSelector(
    (state: RootState) => state.metamask.isUnlocked,
  );

  // Redirect if already unlocked
  useEffect(() => {
    if (isUnlocked) {
      history.push(DEFAULT_ROUTE);
    }
  }, [isUnlocked, history]);

  const handleRestore = useCallback(async () => {
    await dispatch(markPasswordForgotten());
    history.push(RESTORE_VAULT_ROUTE);

    if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
      if (global.platform?.openExtensionInBrowser) {
        global.platform.openExtensionInBrowser(RESTORE_VAULT_ROUTE);
      }
    }
  }, [dispatch, history]);

  const defaultOnSubmit = useCallback(
    async (passwordValue: string) => {
      await dispatch(tryUnlockMetamask(passwordValue));
      history.push(DEFAULT_ROUTE);
    },
    [dispatch, history],
  );

  const handleSubmit = useCallback(
    async (submitEvent: React.FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      submitEvent.stopPropagation();

      if (password === '' || submitting) {
        return;
      }

      setError(null);
      setSubmitting(true);

      try {
        await (customOnSubmit || defaultOnSubmit)(password);

        trackEvent({
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.AppUnlocked,
          properties: {
            failed_attempts: failedAttemptsRef.current,
          },
        });
      } catch (caughtError: unknown) {
        failedAttemptsRef.current += 1;

        const errorMessage =
          caughtError instanceof Error
            ? caughtError.message
            : 'An error occurred';

        if (errorMessage === 'Incorrect password') {
          await forceUpdateMetamaskState(dispatch);
          trackEvent({
            category: MetaMetricsEventCategory.Navigation,
            event: MetaMetricsEventName.AppUnlockedFailed,
            properties: {
              reason: 'incorrect_password',
              failed_attempts: failedAttemptsRef.current,
            },
          });
        }

        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
    [
      password,
      submitting,
      customOnSubmit,
      defaultOnSubmit,
      dispatch,
      trackEvent,
    ],
  );

  const handleInputChange = useCallback(
    (inputEvent: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(inputEvent.target.value);
      setError(null);

      // Tell mascot to look at page action
      const element = inputEvent.target;
      const boundingRect = element.getBoundingClientRect();
      const coordinates = getCaretCoordinates(
        element,
        element.selectionEnd || 0,
      );
      animationEventEmitterRef.current.emit('point', {
        x: boundingRect.left + coordinates.left - element.scrollLeft,
        y: boundingRect.top + coordinates.top - element.scrollTop,
      });
    },
    [],
  );

  const handleSupportLinkClick = useCallback(() => {
    trackEvent(
      {
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: SUPPORT_LINK,
        },
      },
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
    );
  }, [trackEvent]);

  const renderMascot = () => {
    if (isFlask()) {
      return (
        <img
          src="./images/logo/metamask-fox.svg"
          width="120"
          height="120"
          alt="MetaMask Fox"
        />
      );
    }
    if (isBeta()) {
      return (
        <img
          src="./images/logo/metamask-fox.svg"
          width="120"
          height="120"
          alt="MetaMask Fox"
        />
      );
    }
    return (
      <Mascot
        animationEventEmitter={animationEventEmitterRef.current}
        width="120"
        height="120"
      />
    );
  };

  const needHelpText = t('needHelpLinkText');

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      className="bg-background-default w-full"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        justifyContent={BoxJustifyContent.Start}
        alignItems={BoxAlignItems.Center}
        className="w-[400px] text-default p-4"
        data-testid="unlock-page"
      >
        <Box className="relative mt-6">
          {renderMascot()}
          {isBeta() ? (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.PrimaryInverse}
              className="bg-primary-default px-1.5 py-0.5 absolute bottom-2.5 right-0 rounded-xl uppercase"
            >
              {t('beta')}
            </Text>
          ) : null}
        </Box>
        <Text
          data-testid="unlock-page-title"
          variant={TextVariant.DisplayMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextDefault}
        >
          {t('welcomeBack')}
        </Text>

        <Text color={TextColor.TextAlternative}>{t('unlockMessage')}</Text>
        <form className="w-full mt-14 mb-2" onSubmit={handleSubmit} role="form">
          <FormTextField
            id="password"
            data-testid="unlock-password"
            label={t('password')}
            type={TextFieldType.Password}
            value={password}
            onChange={handleInputChange}
            error={error !== null}
            helpText={error || ''}
            autoFocus
            autoComplete
            inputProps={{
              'data-testid': 'unlock-password',
            }}
          />
        </form>
        <Button
          type="submit"
          data-testid="unlock-submit"
          disabled={!password || submitting}
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          className="mt-5"
        >
          {t('unlock')}
        </Button>
        <Button
          variant={ButtonVariant.Tertiary}
          key="import-account"
          onClick={handleRestore}
        >
          {t('forgotPassword')}
        </Button>
        <Text variant={TextVariant.BodySm} className="mt-6">
          {t('needHelp', [
            <a
              href={SUPPORT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              key="need-help-link"
              className="text-primary-default"
              onClick={handleSupportLinkClick}
            >
              {needHelpText}
            </a>,
          ])}
        </Text>
      </Box>
    </Box>
  );
};

export default UnlockPage;
