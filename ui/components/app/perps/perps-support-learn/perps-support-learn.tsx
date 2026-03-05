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

export const PerpsSupportLearn: React.FC = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const handleLearnPerps = useCallback(() => {
    dispatch(setTutorialModalOpen(true));
  }, [dispatch]);

  return (
    <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
      <Box flexDirection={BoxFlexDirection.Column} style={{ gap: '1px' }}>
        <Box
          className={`${LIST_ITEM_BASE} rounded-t-xl`}
          role="button"
          tabIndex={0}
          onClick={() => {
            // TODO: Navigate to support
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
            }
          }}
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('perpsContactSupport')}
          </Text>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
          />
        </Box>
        <Box
          className={LIST_ITEM_BASE}
          role="button"
          tabIndex={0}
          onClick={() => {
            // TODO: Navigate to feedback page
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
            }
          }}
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('perpsGiveFeedback')}
          </Text>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
          />
        </Box>
        <Box
          className={`${LIST_ITEM_BASE} rounded-b-xl`}
          role="button"
          tabIndex={0}
          onClick={handleLearnPerps}
          data-testid="perps-learn-basics"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLearnPerps();
            }
          }}
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('perpsLearnBasics')}
          </Text>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
          />
        </Box>
      </Box>
    </Box>
  );
};
