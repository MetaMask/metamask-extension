import type { FunctionComponent } from 'react';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import {
  BackgroundColor,
  BlockSize,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import { decodeSnapIdFromPathname } from '../../../../helpers/utils/snaps';
import { useSnapSettings } from '../../../../hooks/snaps/useSnapSettings';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getSnapMetadata } from '../../../../selectors';
import { deleteInterface } from '../../../../store/actions';
import { Box, Text } from '../../../component-library';
import { Copyable } from '../copyable';
import { SnapDelineator } from '../snap-delineator';
import { SnapUIRenderer } from '../snap-ui-renderer';

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

  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const { data, error, loading } = useSnapSettings({
    snapId,
  });

  const interfaceId = !loading && !error ? data?.id : undefined;

  useEffect(() => {
    return () => {
      interfaceId && dispatch(deleteInterface(interfaceId));
    };
  }, [interfaceId]);

  if (!snapId) {
    return null;
  }

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
      {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880 */}
      {(interfaceId || loading) && (
        <SnapUIRenderer
          snapId={snapId}
          interfaceId={interfaceId}
          isLoading={loading}
          contentBackgroundColor={BackgroundColor.backgroundDefault}
        />
      )}
    </Box>
  );
};
