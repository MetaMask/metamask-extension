import React from 'react';
import AlertCircleIcon from './alert-circle-icon.component';

export default {
  title: 'AlertCircleIcon',
};

export const dangerCircleIcon = () => <AlertCircleIcon type="danger" />;

export const warningCircleIcon = () => <AlertCircleIcon type="warning" />;
