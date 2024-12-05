import React, { FunctionComponent, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { HandlerType } from '@metamask/snaps-utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { deleteInterface } from '../../../../store/actions';
import { Box, Text } from '../../../component-library';
import {
  BackgroundColor,
  BlockSize,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { SnapDelineator } from '../snap-delineator';
import { getSnapMetadata } from '../../../../selectors';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import { Copyable } from '../copyable';
import { SnapUIRenderer } from '../snap-ui-renderer';
import { useSnapSettings } from '../../../../hooks/snaps/useSnapSettings';
import { decodeSnapIdFromPathname } from '../../../../helpers/utils/snaps';

type SnapSettingsRendererProps = {
  snapId: string;
};

export const SnapSettingsRenderer: FunctionComponent<
  SnapSettingsRendererProps
> = () => {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const t = useI18nContext();

  const snapId = useMemo(() => decodeSnapIdFromPathname(pathname), [pathname]);

  console.log(snapId);
  const { name: snapName } = useSelector((state) =>
    // @ts-expect-error - snapId is a string
    getSnapMetadata(state, snapId),
  );

  if (!snapId) {
    return null;
  }

  const { data, error, loading } = useSnapSettings({
    snapId,
  }) as { data?: { id: string }; error?: Error; loading: boolean };

  const interfaceId = !loading && !error ? data?.id : undefined;

  useEffect(() => {
    return () => {
      interfaceId && dispatch(deleteInterface(interfaceId));
    };
  }, [interfaceId]);

  return (
    <Box
      height={BlockSize.Full}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      {error && (
        <Box height={BlockSize.Full} padding={4}>
          <SnapDelineator snapName={snapName} type={DelineatorType.Error}>
            <Text variant={TextVariant.bodySm} marginBottom={4}>
              {t('snapsUIError', [<b key="0">{snapName}</b>])}
            </Text>
            <Copyable text={error.message} />
          </SnapDelineator>
        </Box>
      )}
      {(interfaceId || loading) && (
        <SnapUIRenderer
          snapId={snapId}
          interfaceId={interfaceId}
          isLoading={loading}
          useDelineator={false}
          contentBackgroundColor={BackgroundColor.backgroundDefault}
        />
      )}
    </Box>
  );
};
