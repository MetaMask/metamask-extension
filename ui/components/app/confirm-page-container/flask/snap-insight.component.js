import React from 'react';
import PropTypes from 'prop-types';

import classnames from 'classnames';

import Preloader from '../../../ui/icon/preloader/preloader-icon.component';
import Typography from '../../../ui/typography/typography';
import { COLORS } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionInsightSnap } from '../../../../hooks/flask/useTransactionInsightSnap';
import SnapContentFooter from '../../flask/snap-content-footer/snap-content-footer';

export const SnapInsight = ({ transaction, chainId, selectedSnap }) => {
  const t = useI18nContext();
  const response = useTransactionInsightSnap({
    transaction,
    chainId,
    snapId: selectedSnap.id,
  });

  const data = response?.insights;

  return (
    <div
      className={classnames('snap-insight', {
        'snap-insight--no-data': !data || !Object.keys(data).length,
      })}
    >
      {data ? (
        <div className="snap-insight__container">
          {Object.keys(data).length ? (
            <>
              <div className="snap-insight__container__data">
                {Object.keys(data).map((key, i) => (
                  <div key={i}>
                    <Typography fontWeight="bold" marginTop={3}>
                      {key}
                    </Typography>
                    <Typography>{data[key]}</Typography>
                  </div>
                ))}
              </div>
              <SnapContentFooter
                snapName={selectedSnap.manifest.proposedName}
                snapId={selectedSnap.id}
              />
            </>
          ) : (
            <Typography color={COLORS.TEXT_ALTERNATIVE}>
              {t('snapsNoInsight')}
            </Typography>
          )}
        </div>
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
  selectedSnap: PropTypes.object,
};
