import React from 'react';
import PropTypes from 'prop-types';
import { Tab } from '../../../ui/tabs';
import { SnapInsight } from '../../confirm-page-container/snaps/snap-insight';
import DropdownTab from '../../../ui/tabs/snaps/dropdown-tab';

export default function TxInsights({
  data,
  loading,
  insightSnaps,
  onChange,
  selectedSnapId,
}) {
  const selectedSnap = insightSnaps.find(({ id }) => id === selectedSnapId);
  if (insightSnaps.length === 1) {
    return (
      <Tab
        className="confirm-page-container-content__tab"
        name={selectedSnap?.manifest.proposedName}
      >
        <SnapInsight data={data?.[0]} loading={loading} />
      </Tab>
    );
  } else if (insightSnaps.length > 1) {
    const dropdownOptions = insightSnaps?.map(
      ({ id, manifest: { proposedName } }) => ({
        value: id,
        name: proposedName,
      }),
    );

    const selectedSnapData = data?.find(
      (promise) => promise?.snapId === selectedSnapId,
    );

    return (
      <DropdownTab
        className="confirm-page-container-content__tab"
        options={dropdownOptions}
        selectedOption={selectedSnapId}
        onChange={onChange}
      >
        <SnapInsight loading={loading} data={selectedSnapData} />
      </DropdownTab>
    );
  }
  return false;
}

TxInsights.propTypes = {
  /**
   * Insight data
   */
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  /**
   * Loading state
   */
  loading: PropTypes.bool.isRequired,
  /**
   * An array of the currently enabled insight snaps
   */
  insightSnaps: PropTypes.arrayOf(PropTypes.object).isRequired,
  /**
   * Handler function for dropdown tab
   */
  onChange: PropTypes.func.isRequired,
  /**
   * Snap ID used for filtering insight data
   */
  selectedSnapId: PropTypes.string.isRequired,
};
