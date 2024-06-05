# Component Library

This folder contains design system components that are built 1:1 with the Figma [DS Components](https://www.figma.com/file/HKpPKij9V3TpsyMV1TpV7C/DS-Components?node-id=16-6) UI kit and should be used where possible in all UI feature work. If you are a designer you can visit the [MetaMask Design System Guides (Design)](https://www.notion.so/MetaMask-Design-System-Guides-Design-f86ecc914d6b4eb6873a122b83c12940?pvs=4).

## Architecture

All components are built on top of the `Box` component and accept all `Box` [component props](/docs/components-componentlibrary-box--docs#props).

### Layout

`component-library` components accept all `Box` component style utility props for layout. They can be used in conjunction with the enums from `ui/helpers/constants/design-system.ts`

```jsx
import { Display } from '../../../helpers/constants/design-system';
import { Text } from '../../component-library';

<Text marginBottom={4} display={Display.Flex} gap={4}>
  <span>This text has a margin-bottom of 16px</span>
  <span>It also has a display of flex and gap of 16px</span>
</Text>;
```

### Polymorphic `as` prop and semantic HTML

`component-library` components accept a polymorphic `as` prop to change the root html element of a component

```jsx
import { Text } from '../../component-library';

<ul>
  <Text as="li">This renders as list item html element</Text>
</ul>;
```

### Style customization and access child components

We understand some customization to styles or access to children components is necessary when building UI. To ensure our components are flexible we intend to allow for customization and access though a pattern called inversion of control.

#### Styles

> Note:
>
> - If you are seeing a disparity between styles in Figma and code that's a red flag and could mean there is bug between design system Figma and code component. We recommend posting it on our slack channel [#metamask-design-system](https://consensys.slack.com/archives/C0354T27M5M) so we can support you on it
> - If you come across the warning `Unexpected hex color` when using a hex value in a stylesheet, it is there to encourage the use of [MetaMask's design-tokens](https://github.com/MetaMask/design-tokens/) color variables instead of hardcoding hex values. This helps maintain consistency and makes updating colors across the app easier.

We try to utilize the `Box` component style utility props as much as possible in our components. Style utility prop overrides should be your first option. This allows you to change styles right inside of the component and reduces the amount of CSS in the codebase. If there are no style utility props for the customization required you can attach a class name to the component using the `className` prop and add styling using CSS.

```jsx
import { BackgroundColor } from '../../../helpers/constants/design-system';
import { Button } from '../../component-library';

// Overriding the browser default styling using style utility props
<Text
  as="button"
  backgroundColor={BackgroundColor.transparent}
  onClick={handleOnClick}
>
  Renders as a button but has a transparent background
</Text>;

<Text
  as="button"
  backgroundColor={BackgroundColor.transparent}
  onClick={handleOnClick}
  className="nft-feature__title"
>
  Adding a custom className to add additional styles using CSS
</Text>;
```

### Access to child components

All of our components should allow access to children components through an object prop. The example below adds a data test id to the child `Text` component inside `BannerAlert`.

```jsx
import { BannerAlert, BannerAlertSeverity } from '../../component-library';

<BannerAlert
  severity={Severity.Danger}
  title="This allows a third party to access and transfer all of your NFTs"
  titleProps={{ 'data-testid': 'approve-token-banner-title' }}
/>;
```

### Accessibility

Allowing everyone to access web3 regardless of disability is an important part of what we do at MetaMask. Ensuring accessibility in our components is a priority. We strive to achieve this by maintaining proper color contrast in our components and implementing necessary aria label props. If you have any questions regarding accessibility reach out and we will support you as much as possible. Additionally, your suggestions for improvement are welcome, as we continue our journey towards greater accessibility. Together, let's create an inclusive web3 experience for all 🦾

## Support

If internal folks have any questions please reach out the design system team via the internal slack channel [#metamask-design-system](https://consensys.slack.com/archives/C0354T27M5M) 💁

[DS components figma file](https://www.figma.com/file/HKpPKij9V3TpsyMV1TpV7C/DS-Components?node-id=16%3A6)
