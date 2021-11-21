import React from 'react';
import AlertCircleIcon from './alert-circle-icon.component';

export default {
  title: 'AlertCircleIcon',
  id: __filename,
};

export const dangerCircleIcon = () => <AlertCircleIcon type="danger" />;

export const warningCircleIcon = () => <AlertCircleIcon type="warning" />;
