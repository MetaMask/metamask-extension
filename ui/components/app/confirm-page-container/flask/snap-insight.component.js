import React from 'react';
import PropTypes from 'prop-types';

import classnames from 'classnames';

import Preloader from '../../../ui/icon/preloader/preloader-icon.component';
import Box from '../../../ui/box/box';
import Typography from '../../../ui/typography/typography';
import { COLORS } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionInsightSnap } from '../../../../hooks/flask/useTransactionInsightSnap';

export const SnapInsight = ({ transaction, chainId, snapId }) => {
  const response = useTransactionInsightSnap({
    transaction,
    chainId,
    snapId,
  });

  const data = response?.insights;

  const t = useI18nContext();

  return (
    <div
      className={classnames('snap-insight', {
        'snap-insight--no-data': !data || !Object.keys(data).length,
      })}
    >
      {data ? (
        <>
          {Object.keys(data).length ? (
            <div className="snap-insight__container">
              {Object.keys(data).map((key, i) => (
                <div className="snap-insight__container__data" key={i}>
                  <Typography fontWeight="bold">{key}</Typography>
                  <Typography>{data[key]}</Typography>
                </div>
              ))}
            </div>
          ) : (
            <Typography color={COLORS.TEXT_ALTERNATIVE}>
              {t('snapsNoInsight')}
            </Typography>
          )}
        </>
      ) : (
        <>
          <Preloader size={40} />
          <Typography marginTop={3} color={COLORS.TEXT_ALTERNATIVE}>
            {t('snapsInsightLoading')}
          </Typography>
        </>
      )}
    </div>
  );
};

SnapInsight.propTypes = {
  transaction: PropTypes.object,
  chainId: PropTypes.string,
  snapId: PropTypes.string,
};
