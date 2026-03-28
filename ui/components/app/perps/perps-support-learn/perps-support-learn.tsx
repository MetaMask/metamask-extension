import React, { useCallback } from 'react';
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

  const handleLearnPerps = useCallback(() => {
    dispatch(setTutorialModalOpen(true));
  }, [dispatch]);

  return (
    <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
      <Box flexDirection={BoxFlexDirection.Column} style={{ gap: '1px' }}>
        <SupportListItem
          label={t('perpsContactSupport')}
          onClick={() => {
            // TODO: Navigate to support
          }}
          className="rounded-t-xl"
        />
        <SupportListItem
          label={t('perpsGiveFeedback')}
          onClick={() => {
            // TODO: Navigate to feedback page
          }}
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
