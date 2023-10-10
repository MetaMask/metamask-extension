import React from 'react';
import InfoTooltip from '../../ui/info-tooltip/info-tooltip';
import { COLORS } from '../../../helpers/constants/design-system';
import Typography from '../../ui/typography/typography';
import TransactionDetailItem from '.';

export default {
  title: 'Transaction Detail Item',
  id: __filename,
};

export const Minimal = () => {
  return (
    <div style={{ width: '400px' }}>
      <TransactionDetailItem
        detailTitle={
          <>
            <strong>Estimated gas fee</strong>
            <InfoTooltip contentText="This is the tooltip text" position="top">
              <i className="fa fa-info-circle" />
            </InfoTooltip>
          </>
        }
        detailText="16565.30"
        detailTotal="0.0089 ETH"
      />
    </div>
  );
};

export const WithSubTitleAndTextBasedSubText = () => {
  return (
    <div style={{ width: '400px' }}>
      <TransactionDetailItem
        detailTitle={
          <>
            <strong>Estimated gas fee</strong>
            <InfoTooltip contentText="This is the tooltip text" position="top">
              <i className="fa fa-info-circle" />
            </InfoTooltip>
          </>
        }
        detailText="16565.30"
        detailTotal="0.0089 ETH"
        subTitle="Max amount"
        subText="$12000"
      />
    </div>
  );
};

export const WithSubtitleAndComponentBasedSubText = () => {
  return (
    <div style={{ width: '400px' }}>
      <TransactionDetailItem
        detailTitle={
          <>
            <strong>Estimated gas fee</strong>
            <InfoTooltip contentText="This is the tooltip text" position="top">
              <i className="fa fa-info-circle" />
            </InfoTooltip>
          </>
        }
        detailText="16565.30"
        detailTotal="0.0089 ETH"
        subTitle={<Typography color={COLORS.SECONDARY1}>Max amount</Typography>}
        subText={
          <>
            From <strong>$16565 - $19000</strong>
          </>
        }
      />
    </div>
  );
};
