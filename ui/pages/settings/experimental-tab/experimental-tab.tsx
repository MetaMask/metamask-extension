import React, { useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Text,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  TextColor,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  ///: END:ONLY_INCLUDE_IF
} from '@metamask/design-system-react';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
///: END:ONLY_INCLUDE_IF

import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  setAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  setFeatureNotificationsEnabled,
  setWatchEthereumAccountEnabled,
} from '../../../store/actions';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getIsAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  getFeatureNotificationsEnabled,
  getIsWatchEthereumAccountEnabled,
} from '../../../selectors';

type ItemProps = {
  title: string;
  description: React.ReactNode;
  toggleValue: boolean;
  toggleCallback: (value: boolean) => void;
  toggleDataTestId: string;
  sectionRef?: React.RefObject<HTMLDivElement>;
};

const Item = ({
  title,
  description,
  toggleValue,
  toggleCallback,
  toggleDataTestId,
  sectionRef,
}: ItemProps) => (
  <Box
    ref={sectionRef}
    flexDirection={BoxFlexDirection.Column}
    gap={1}
    marginTop={4}
  >
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
    >
      <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
        {title}
      </Text>
      <ToggleButton
        value={toggleValue}
        onToggle={toggleCallback}
        dataTestId={toggleDataTestId}
      />
    </Box>
    <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
      {description}
    </Text>
  </Box>
);

const ExperimentalTab = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);

  const featureNotificationsEnabled = useSelector(
    getFeatureNotificationsEnabled,
  );
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  const addSnapAccountEnabled = useSelector(getIsAddSnapAccountEnabled);
  ///: END:ONLY_INCLUDE_IF
  const watchAccountEnabled = useSelector(getIsWatchEthereumAccountEnabled);

  const settingsRefs = useMemo(() => {
    const count = getNumberOfSettingRoutesInTab(t, t('experimental'));
    return Array(count)
      .fill(undefined)
      .map(() => React.createRef<HTMLDivElement>());
  }, [t]);

  useEffect(() => {
    handleSettingsRefs(t, t('experimental'), settingsRefs);
  }, [t, settingsRefs]);

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  const KeyringSnapsItem = () => (
    <Item
      title={t('addSnapAccountToggle')}
      description={t('addSnapAccountsDescription')}
      toggleValue={addSnapAccountEnabled}
      toggleCallback={(value) => {
        trackEvent({
          event: MetaMetricsEventName.AddSnapAccountEnabled,
          category: MetaMetricsEventCategory.Settings,
          properties: {
            enabled: !value,
          },
        });
        dispatch(setAddSnapAccountEnabled(!value));
      }}
      toggleDataTestId={'add-account-snap-toggle-button'}
      sectionRef={settingsRefs[0]}
    />
  );
  ///: END:ONLY_INCLUDE_IF

  const NotificationsItem = () => (
    <Item
      title={t('notificationsFeatureToggle')}
      description={t('notificationsFeatureToggleDescription')}
      toggleValue={featureNotificationsEnabled}
      toggleCallback={(value) =>
        dispatch(setFeatureNotificationsEnabled(!value))
      }
      toggleDataTestId={'toggle-notifications'}
      sectionRef={settingsRefs[0]}
    />
  );

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask,build-experimental)
  const WatchAccountItem = () => (
    <Item
      title={t('watchEthereumAccountsToggle')}
      description={t('watchEthereumAccountsDescription', [
        <a
          key="watch-account-feedback-form__link-text"
          href="https://www.getfeedback.com/r/7Je8ckkq"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('form')}
        </a>,
      ])}
      toggleValue={watchAccountEnabled}
      toggleCallback={(value) => {
        trackEvent({
          event: MetaMetricsEventName.WatchEthereumAccountsToggled,
          category: MetaMetricsEventCategory.Settings,
          properties: {
            enabled: !value,
          },
        });
        dispatch(setWatchEthereumAccountEnabled(!value));
      }}
      toggleDataTestId={'watch-account-toggle'}
      sectionRef={settingsRefs[0]}
    />
  );
  ///: END:ONLY_INCLUDE_IF

  return (
    <Box paddingHorizontal={4} paddingBottom={4}>
      {process.env.NOTIFICATIONS ? <NotificationsItem /> : null}
      {
        ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
        <KeyringSnapsItem />
        ///: END:ONLY_INCLUDE_IF
      }
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-flask,build-experimental)
        <WatchAccountItem />
        ///: END:ONLY_INCLUDE_IF
      }
    </Box>
  );
};

export default ExperimentalTab;
