import React, { useCallback, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextAlign,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { BaseUrl } from '../../../../shared/constants/urls';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getRedirectAfterUnlock } from '../../../helpers/utils/redirect-after-unlock';
import { UNLOCK_ROUTE } from '../../../helpers/constants/routes';
import SetupPasskeyContent from '../../../components/app/passkey-setup/setup-passkey-content';

const supportedProvidersLinkClassName =
  'underline underline-offset-2 hover:underline';

/**
 * Runs the passkey userHandle-to-PRF migration after the wallet is unlocked.
 *
 * @returns The passkey migration page.
 */
export default function PasskeyPrfMigration() {
  const navigate = useNavigate();
  const location = useLocation();
  const isUnlocked = useSelector(getIsUnlocked);
  const [isReplacementStarted, setIsReplacementStarted] = useState(false);

  const navigateAfterMigration = useCallback(() => {
    navigate(getRedirectAfterUnlock(location.state), { replace: true });
  }, [location.state, navigate]);

  const startReplacement = useCallback(() => {
    setIsReplacementStarted(true);
  }, []);

  if (!isUnlocked) {
    return <Navigate to={UNLOCK_ROUTE} replace state={{ from: location }} />;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full w-full"
      data-testid="parent-selector-passkey-prf-migration"
    >
      {isReplacementStarted ? (
        <SetupPasskeyContent
          onNext={navigateAfterMigration}
          onSkip={navigateAfterMigration}
          isPasskeyRegistered={false}
          checkPasskeyPRFSupport={false}
          isPrfMigration
        />
      ) : (
        <PasskeyMigrationPrompt
          onReplacePasskey={startReplacement}
          onRemindMeLater={navigateAfterMigration}
        />
      )}
    </Box>
  );
}

type PasskeyMigrationPromptProps = Readonly<{
  onReplacePasskey: () => void;
  onRemindMeLater: () => void;
}>;

// eslint-disable-next-line @typescript-eslint/naming-convention -- React component
function PasskeyMigrationPrompt({
  onReplacePasskey,
  onRemindMeLater,
}: PasskeyMigrationPromptProps) {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={4}
      padding={4}
      className="w-full"
      data-testid="passkey-migration-prompt"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        className="my-8 w-full"
      >
        <img
          src="images/biometric.png"
          alt="Biometrics"
          width={160}
          height={160}
        />
      </Box>
      <Text
        variant={TextVariant.HeadingMd}
        color={TextColor.TextDefault}
        textAlign={TextAlign.Left}
        fontWeight={FontWeight.Medium}
        className="w-full"
      >
        {t('passkeyMigrationTitle')}
      </Text>
      <Box flexDirection={BoxFlexDirection.Column} gap={4} className="w-full">
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          data-testid="passkey-migration-description-1"
        >
          {t('passkeyMigrationDescription1')}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          data-testid="passkey-migration-description-2"
        >
          {t('passkeyMigrationDescription2', [
            <TextButton
              asChild
              key="passkey-migration-supported-providers"
              color={TextColor.PrimaryDefault}
              className={supportedProvidersLinkClassName}
            >
              <a
                href={BaseUrl.MetaMask}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="passkey-migration-supported-providers-link"
              >
                {t('passkeyMigrationSupportedProviders')}
              </a>
            </TextButton>,
          ])}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          data-testid="passkey-migration-description-3"
        >
          {t('passkeyMigrationDescription3')}
        </Text>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={3}
        className="mt-4 w-full"
      >
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          className="w-full"
          data-testid="passkey-migration-replace-button"
          onClick={onReplacePasskey}
        >
          {t('replacePasskey')}
        </Button>
        <TextButton
          type="button"
          color={TextColor.PrimaryDefault}
          className="w-full"
          data-testid="passkey-migration-remind-me-later-button"
          onClick={onRemindMeLater}
        >
          {t('remindMeLater')}
        </TextButton>
      </Box>
    </Box>
  );
}
