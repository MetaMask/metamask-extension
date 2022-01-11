import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

export default function TimestampRow({ date }) {
  return (
    <div>{`${moment(date * 1000).format('MMM D YYYY, h:mm a')} (${moment(
      date * 1000,
    ).fromNow()})`}</div>
  );
}

TimestampRow.propTypes = {
  date: PropTypes.number,
};
