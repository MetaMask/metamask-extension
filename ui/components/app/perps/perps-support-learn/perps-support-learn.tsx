import React, { useCallback, useContext } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Text,
  TextVariant,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import { useDispatch } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import {
  FEEDBACK_CONFIG,
  SUPPORT_CONFIG,
} from '../../../../../shared/constants/perps';
import { setTutorialModalOpen } from '../../../../ducks/perps';

const LIST_ITEM_BASE =
  'flex items-center gap-3 px-4 py-3 bg-background-muted cursor-pointer hover:bg-hover active:bg-pressed';

type SupportListItemProps = {
  label: string;
  onClick: () => void;
  className?: string;
  'data-testid'?: string;
};

const SupportListItem: React.FC<SupportListItemProps> = ({
  label,
  onClick,
  className,
  'data-testid': testId,
}) => (
  <Box
    className={`${LIST_ITEM_BASE} ${className ?? ''}`}
    role="button"
    tabIndex={0}
    onClick={onClick}
    data-testid={testId}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    flexDirection={BoxFlexDirection.Row}
    justifyContent={BoxJustifyContent.Between}
    alignItems={BoxAlignItems.Center}
  >
    <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
      {label}
    </Text>
    <Icon
      name={IconName.ArrowRight}
      size={IconSize.Sm}
      color={IconColor.IconAlternative}
    />
  </Box>
);

export const PerpsSupportLearn: React.FC = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);

  const handleLearnPerps = useCallback(() => {
    dispatch(setTutorialModalOpen(true));
  }, [dispatch]);

  const handleContactSupport = useCallback(() => {
    trackEvent(
      {
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: SUPPORT_CONFIG.Url,
          location: 'perps_support_learn',
        },
      },
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
    );
    globalThis.platform.openTab({ url: SUPPORT_CONFIG.Url });
  }, [trackEvent]);

  const handleFeedback = useCallback(() => {
    trackEvent(
      {
        category: MetaMetricsEventCategory.Feedback,
        event: MetaMetricsEventName.ExternalLinkClicked,
        properties: {
          url: FEEDBACK_CONFIG.Url,
          location: 'perps_support_learn',
          text: 'perps_feedback_survey',
        },
      },
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
    );
    globalThis.platform.openTab({ url: FEEDBACK_CONFIG.Url });
  }, [trackEvent]);

  return (
    <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
      <Box flexDirection={BoxFlexDirection.Column} style={{ gap: '1px' }}>
        <SupportListItem
          label={t('perpsContactSupport')}
          onClick={handleContactSupport}
          className="rounded-t-xl"
          data-testid="perps-contact-support"
        />
        <SupportListItem
          label={t('perpsGiveFeedback')}
          onClick={handleFeedback}
          data-testid="perps-give-feedback"
        />
        <SupportListItem
          label={t('perpsLearnBasics')}
          onClick={handleLearnPerps}
          className="rounded-b-xl"
          data-testid="perps-learn-basics"
        />
      </Box>
    </Box>
  );
};
