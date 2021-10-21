import React from 'react';
import AlertCircleIcon from './alert-circle-icon.component';

export default {
  title: 'UI/Icon/Alert Circle Icon',
  id: __filename,
};

export const DangerCircleIcon = () => <AlertCircleIcon type="danger" />;

export const WarningCircleIcon = () => <AlertCircleIcon type="warning" />;
