import { Story, Canvas, ArgsTable } from '@storybook/addon-docs';

import { PickerNetwork } from './picker-network';

# PickerNetwork
a
The `PickerNetwork` component is used for the action of changing a network.

<Canvas>
  <Story id="components-componentlibrary-picker-network--default-story" />
</Canvas>

## Props

The `PickerNetwork` component accepts the following props in addition to all [Box](/docs/components-ui-box--default-story#props) component props.

<ArgsTable of={PickerNetwork} />

### label

Use the `label` prop to specify the text content of the `PickerNetwork` component. For long labels, you can set a `max-width` using a `className`, and the text will be truncated, showing an ellipsis.

<Canvas>
  <Story id="components-componentlibrary-picker-network--label" />
</Canvas>

```tsx
import { PickerNetwork } from '../../ui/component-library';

<PickerNetwork label="Arbitrum One" />
<PickerNetwork label="Polygon Mainnet" />
<PickerNetwork label="Optimism" />
<PickerNetwork label="BNB Smart Chain (previously Binance Smart Chain Mainnet)" style={{ maxWidth: '200px' }} />
```

### src
Use the src prop with an image URL to render the AvatarNetwork component. You can also use the avatarNetworkProps prop to pass additional props to the AvatarNetwork component.

<Canvas>
  <Story id="components-componentlibrary-picker-network--src" />
</Canvas>

```jsx
import { PickerNetwork } from '../../ui/component-library';
<PickerNetwork src="./images/arbitrum.svg" />
<PickerNetwork src="./images/matic-token.png" />
<PickerNetwork src="./images/optimism.svg" />
```
