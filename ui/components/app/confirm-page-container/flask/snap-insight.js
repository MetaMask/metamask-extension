import React from 'react';
import PropTypes from 'prop-types';

import Preloader from '../../../ui/icon/preloader/preloader-icon.component';
import Typography from '../../../ui/typography/typography';
import {
  ALIGN_ITEMS,
  COLORS,
  FLEX_DIRECTION,
  JUSTIFY_CONTENT,
  TEXT_ALIGN,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionInsightSnap } from '../../../../hooks/flask/useTransactionInsightSnap';
import SnapContentFooter from '../../flask/snap-content-footer/snap-content-footer';
import Box from '../../../ui/box/box';

export const SnapInsight = ({ transaction, chainId, selectedSnap }) => {
  const t = useI18nContext();
  const response = useTransactionInsightSnap({
    transaction,
    chainId,
    snapId: selectedSnap.id,
  });

  const data = response?.insights;

  const hasNoData = !data || !Object.keys(data).length;

  return (
    <Box
      flexDirection={FLEX_DIRECTION.COLUMN}
      height="full"
      marginTop={hasNoData && 12}
      marginBottom={hasNoData && 12}
      alignItems={hasNoData && ALIGN_ITEMS.CENTER}
      justifyContent={hasNoData && JUSTIFY_CONTENT.CENTER}
      textAlign={hasNoData && TEXT_ALIGN.CENTER}
      className="snap-insight"
    >
      {data ? (
        <Box
          height="full"
          flexDirection={FLEX_DIRECTION.COLUMN}
          className="snap-insight__container"
        >
          {Object.keys(data).length ? (
            <>
              <Box
                flexDirection={FLEX_DIRECTION.COLUMN}
                paddingTop={0}
                paddingRight={6}
                paddingBottom={3}
                paddingLeft={6}
                className="snap-insight__container__data"
              >
                {Object.keys(data).map((key, i) => (
                  <div key={i}>
                    <Typography
                      fontWeight="bold"
                      marginTop={3}
                      variant={TYPOGRAPHY.H6}
                    >
                      {key}
                    </Typography>

                    {typeof data[key] === 'string' ? (
                      <Typography variant={TYPOGRAPHY.H6}>
                        {data[key]}
                      </Typography>
                    ) : (
                      <Box
                        className="snap-insight__container__data__json"
                        backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
                        padding={3}
                      >
                        <Typography variant={TYPOGRAPHY.H7}>
                          <pre>{JSON.stringify(data[key], null, 2)}</pre>
                        </Typography>
                      </Box>
                    )}
                  </div>
                ))}
              </Box>
              <SnapContentFooter
                snapName={selectedSnap.manifest.proposedName}
                snapId={selectedSnap.id}
              />
            </>
          ) : (
            <Typography color={COLORS.TEXT_ALTERNATIVE} variant={TYPOGRAPHY.H6}>
              {t('snapsNoInsight')}
            </Typography>
          )}
        </Box>
      ) : (
        <>
          <Preloader size={40} />
          <Typography
            marginTop={3}
            color={COLORS.TEXT_ALTERNATIVE}
            variant={TYPOGRAPHY.H6}
          >
            {t('snapsInsightLoading')}
          </Typography>
        </>
      )}
    </Box>
  );
};

SnapInsight.propTypes = {
  /*
   * The transaction data object
   */
  transaction: PropTypes.object,
  /*
   * CAIP2 Chain ID
   */
  chainId: PropTypes.string,
  /*
   * The insight snap selected
   */
  selectedSnap: PropTypes.object,
};
