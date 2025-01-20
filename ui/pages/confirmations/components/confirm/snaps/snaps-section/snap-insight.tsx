import React from 'react';
import { useSelector } from 'react-redux';
import { SnapUIRenderer } from '../../../../../../components/app/snaps/snap-ui-renderer';
import { Delineator } from '../../../../../../components/ui/delineator';
import { Text } from '../../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
  FontWeight,
  BackgroundColor,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getSnapMetadata } from '../../../../../../selectors';
import Tooltip from '../../../../../../components/ui/tooltip';

export type SnapInsightProps = {
  snapId: string;
  interfaceId: string;
  loading: boolean;
  isExpanded?: boolean | undefined;
};

export const SnapInsight: React.FunctionComponent<SnapInsightProps> = ({
  snapId,
  interfaceId,
  loading,
  isExpanded,
}) => {
  const t = useI18nContext();
  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const headerComponent = (
    <Text>
      {t('insightsFromSnap', [
        <Text
          fontWeight={FontWeight.Medium}
          variant={TextVariant.inherit}
          color={TextColor.inherit}
        >
          {snapName}
        </Text>,
      ])}
    </Text>
  );

  const hasNoInsight = !loading && !interfaceId;

  if (hasNoInsight) {
    return (
      <Tooltip position="top" title={t('snapsNoInsight')}>
        <Delineator headerComponent={headerComponent} isDisabled={true} />
      </Tooltip>
    );
  }

  return (
    <Delineator
      headerComponent={headerComponent}
      isLoading={loading}
      isExpanded={isExpanded}
      contentBoxProps={
        loading
          ? undefined
          : {
              paddingLeft: 0,
              paddingRight: 0,
              paddingTop: 0,
              paddingBottom: 0,
            }
      }
    >
      <SnapUIRenderer
        snapId={snapId}
        interfaceId={interfaceId}
        isLoading={loading}
        useDelineator={false}
        contentBackgroundColor={BackgroundColor.backgroundDefault}
      />
    </Delineator>
  );
};
