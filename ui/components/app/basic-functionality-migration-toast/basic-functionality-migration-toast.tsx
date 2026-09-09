import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
  Toast,
} from '@metamask/design-system-react';
import { PRIVACY_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getUseExternalServices } from '../../../selectors';
import { getShouldShowBasicFunctionalityMigrationToast } from '../../../selectors/multichain/feature-flags';
import { hideMigrationToast } from '../../../store/actions';
import { useDispatch } from '../../../store/hooks';

export function BasicFunctionalityMigrationToast() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const shouldShow = useSelector(getShouldShowBasicFunctionalityMigrationToast);
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);

  if (!shouldShow) {
    return null;
  }

  const dismissToast = () => {
    dispatch(hideMigrationToast());
  };

  const openPrivacySettings = () => {
    dismissToast();
    navigate(PRIVACY_ROUTE);
  };

  return (
    <Toast
      data-testid="basic-functionality-migration-toast"
      className="relative w-full max-w-[432px] self-center p-3 [&>button:last-child]:absolute [&>button:last-child]:right-3 [&>button:last-child]:top-3"
      title={t('basicFunctionalityMigrationModalTitle')}
      titleProps={{ variant: TextVariant.BodyMd, className: 'pr-10' }}
      description={
        <div className="pt-0.5">
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('basicFunctionalityMigrationToastDescription', [
              isBasicFunctionalityEnabled
                ? t('basicFunctionalityMigrationToastEnabled')
                : t('basicFunctionalityMigrationToastDisabled'),
              <TextButton
                key="basic-functionality-migration-settings-link"
                size={TextButtonSize.BodySm}
                className="inline-flex p-0 align-baseline"
                data-testid="basic-functionality-migration-settings-link"
                onClick={openPrivacySettings}
              >
                {t('basicFunctionalityMigrationToastSettingsLink')}
              </TextButton>,
            ])}
          </Text>
        </div>
      }
      closeButtonProps={{ ariaLabel: t('close') }}
      onClose={dismissToast}
    />
  );
}
