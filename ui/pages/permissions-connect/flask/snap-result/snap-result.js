import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { PageContainerFooter } from '../../../../components/ui/page-container';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import Box from '../../../../components/ui/box/box';
import {
  AlignItems,
  BLOCK_SIZES,
  BorderStyle,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  JustifyContent,
  TextVariant,
  TEXT_ALIGN,
} from '../../../../helpers/constants/design-system';
import { Text } from '../../../../components/component-library';
import PulseLoader from '../../../../components/ui/pulse-loader/pulse-loader';
import InstallError from '../../../../components/app/flask/install-error/install-error';
import SnapsAuthorshipPill from '../../../../components/app/flask/snaps-authorship-pill/snaps-authorship-pill';
import { getSnapName } from '../../../../helpers/utils/util';

export default function SnapResult({
  request,
  requestState,
  approveSnapResult,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();

  const onSubmit = useCallback(
    () => approveSnapResult(request.metadata.id),
    [request, approveSnapResult],
  );

  const hasError = !requestState.loading && requestState.error;

  const isLoading = requestState.loading;

  const snapName = getSnapName(targetSubjectMetadata.origin);

  return (
    <Box
      className="page-container snap-result"
      justifyContent={JustifyContent.spaceBetween}
      height={BLOCK_SIZES.FULL}
      borderStyle={BorderStyle.none}
      flexDirection={FLEX_DIRECTION.COLUMN}
    >
      <Box
        className="headers"
        alignItems={AlignItems.center}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <SnapsAuthorshipPill
          snapId={targetSubjectMetadata.origin}
          version={targetSubjectMetadata.version}
        />
        {isLoading && (
          <Box
            className="loader-container"
            flexDirection={FLEX_DIRECTION.COLUMN}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            <PulseLoader />
          </Box>
        )}
        {!isLoading && !hasError && (
          <Box
            flexDirection={FLEX_DIRECTION.COLUMN}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            height={BLOCK_SIZES.FULL}
            padding={2}
          >
            <Text
              fontWeight={FONT_WEIGHT.BOLD}
              variant={TextVariant.headingLg}
              paddingBottom={2}
            >
              {t('snapResultSuccess')}
            </Text>
            <Text textAlign={TEXT_ALIGN.CENTER}>
              {t('snapResultSuccessDescription', [<b key="1">{snapName}</b>])}
            </Text>
          </Box>
        )}
        {hasError && (
          <InstallError
            error={requestState.error}
            title={t('snapResultError')}
          />
        )}
      </Box>
      <Box
        className="footers"
        alignItems={AlignItems.center}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <PageContainerFooter
          hideCancel
          disabled={isLoading}
          onSubmit={onSubmit}
          submitText={t('ok')}
        />
      </Box>
    </Box>
  );
}

SnapResult.propTypes = {
  request: PropTypes.object.isRequired,
  requestState: PropTypes.object.isRequired,
  approveSnapResult: PropTypes.func.isRequired,
  targetSubjectMetadata: PropTypes.shape({
    iconUrl: PropTypes.string,
    name: PropTypes.string,
    origin: PropTypes.string.isRequired,
    sourceCode: PropTypes.string,
    version: PropTypes.string,
  }).isRequired,
};
