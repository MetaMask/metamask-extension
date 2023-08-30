import React from 'react';
import { SelectV1 } from './select';
import { SelectV2 } from './select-v2';

export default {
  title: 'Components/ComponentLibrary/Select', // title should follow the folder structure location of the component. Don't use spaces.
};

export const SelectStoryV1 = () => <SelectV1 />;
export const SelectStoryV2 = () => <SelectV2 />;
