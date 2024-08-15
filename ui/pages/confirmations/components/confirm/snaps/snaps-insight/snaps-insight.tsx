import React from 'react';
import { useSelector } from 'react-redux';
import { SnapUIRenderer } from '../../../../../../components/app/snaps/snap-ui-renderer';
import { Delineator } from '../../../../../../components/ui/delineator';
import { IconName, Text } from '../../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getSnapMetadata } from '../../../../../../selectors';

export type SnapInsightProps = {
  snapId: string;
  interfaceId: string;
  loading: boolean;
};

export const SnapInsight: React.FunctionComponent<SnapInsightProps> = ({
  snapId,
  interfaceId,
  loading,
}) => {
  const t = useI18nContext();
  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const headerComponent = (
    <Text
      color={TextColor.textAlternative}
      marginLeft={1}
      variant={TextVariant.bodySm}
    >
      {t('insightsFromSnap', [snapName])}
    </Text>
  );

  return (
    <Delineator iconName={IconName.Snaps} headerComponent={headerComponent}>
      <SnapUIRenderer
        snapId={snapId}
        interfaceId={interfaceId}
        isLoading={loading}
        useDelineator={false}
      />
    </Delineator>
  );
};
