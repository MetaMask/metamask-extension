import React, { useState } from 'react';
import { Delineator } from '.';
import { DelineatorType } from './delineator.types';
import { Text, IconName } from '../../component-library';
import {
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';

export default {
  title: 'Components/UI/Delineator',
  decorators: [
    (story: () => React.ReactNode) => (
      <div
        style={{
          backgroundColor: 'var(--color-background-alternative)',
          padding: 16,
        }}
      >
        {story()}
      </div>
    ),
  ],
};

const headerComponent = (
  <Text
    color={TextColor.textAlternative}
    marginLeft={1}
    variant={TextVariant.bodySm}
  >
    Insights from <b>Forta</b>
  </Text>
);
const exampleContent = (
  <Text
    color={TextColor.textAlternative}
    variant={TextVariant.bodySm}
    marginLeft={1}
    marginRight={1}
  >
    This transaction will not transfer any assets from or to your account.
  </Text>
);

export const DefaultStory = () => (
  <Delineator headerComponent={headerComponent} iconName={IconName.Snaps}>
    {exampleContent}
  </Delineator>
);

export const InitiallyExpanded = () => (
  <Delineator
    headerComponent={headerComponent}
    iconName={IconName.Snaps}
    isExpanded
  >
    {exampleContent}
  </Delineator>
);

export const InitiallyExpandedAndNotCollapsable = () => (
  <Delineator
    headerComponent={headerComponent}
    iconName={IconName.Wallet}
    isExpanded
    isCollapsible={false}
  >
    {exampleContent}
  </Delineator>
);

export const LoadingStory = () => (
  <Delineator
    headerComponent={headerComponent}
    iconName={IconName.Usb}
    isLoading
  >
    {exampleContent}
  </Delineator>
);

export const ErrorStory = () => (
  <Delineator
    headerComponent={headerComponent}
    iconName={IconName.Snaps}
    type={DelineatorType.Error}
  >
    {exampleContent}
  </Delineator>
);

export const OnExpandChangeStory = () => {
  const [expandEvents, setExpandEvents] = useState<string[]>([]);
  const handleOnExpandChange = (isExpanded: boolean) => {
    setExpandEvents([
      ...expandEvents,
      `isExpanded: ${isExpanded} at ${new Date().toLocaleTimeString()}`,
    ]);
  };

  return (
    <>
      <Delineator
        headerComponent={headerComponent}
        iconName={IconName.Snaps}
        type={DelineatorType.Error}
        onExpandChange={handleOnExpandChange}
      >
        {exampleContent}
      </Delineator>
      <div style={{ paddingTop: 20 }}>
        {expandEvents.map((event, index) => (
          <Text
            key={index}
            color={TextColor.textAlternative}
            variant={TextVariant.bodySm}
            marginLeft={1}
          >
            {event}
          </Text>
        ))}
      </div>
    </>
  );
};
