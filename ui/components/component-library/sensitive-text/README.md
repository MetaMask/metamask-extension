# SensitiveText

SensitiveText is a component that extends the Text component to handle sensitive information. It provides the ability to hide or show the text content, replacing it with asterisks when hidden.

## Props

This component extends all props from the [Text](../text/README.md) component and adds the following:

### `isHidden`

Boolean to determine whether the text should be hidden or visible.

| <span style="color:gray;font-size:14px">TYPE</span> | <span style="color:gray;font-size:14px">REQUIRED</span> | <span style="color:gray;font-size:14px">DEFAULT</span> |
| :-------------------------------------------------- | :------------------------------------------------------ | :----------------------------------------------------- |
| boolean                                             | No                                                      | false                                                  |

### `length`

Determines the length of the hidden text (number of asterisks). Can be a predefined SensitiveTextLength or a custom string number.

| <span style="color:gray;font-size:14px">TYPE</span> | <span style="color:gray;font-size:14px">REQUIRED</span> | <span style="color:gray;font-size:14px">DEFAULT</span> |
| :-------------------------------------------------- | :------------------------------------------------------ | :----------------------------------------------------- |
| [SensitiveTextLengthType](./sensitive-text.types.ts#L14) \| [CustomLength](./sensitive-text.types.ts#L19) | No   | SensitiveTextLength.Short                              |

### `children`

The text content to be displayed or hidden.

| <span style="color:gray;font-size:14px">TYPE</span> | <span style="color:gray;font-size:14px">REQUIRED</span> | <span style="color:gray;font-size:14px">DEFAULT</span> |
| :-------------------------------------------------- | :------------------------------------------------------ | :----------------------------------------------------- |
| React.ReactNode                                     | No                                                      | ''                                                     |

## Usage
```jsx
import { SensitiveText } from '../sensitive-text';
import { SensitiveTextLength } from './sensitive-text.types';
<SensitiveText
isHidden={true}
length={SensitiveTextLength.Medium}
>
Sensitive Information
</SensitiveText>
<SensitiveText
isHidden={true}
length="15"
>
Custom Length Hidden Text
</SensitiveText>
```

This will render a Text component with asterisks instead of the actual text when `isHidden` is true, and the original text when `isHidden` is false. The number of asterisks is determined by the `length` prop.

## Behavior

- When `isHidden` is `true`, the component will display asterisks instead of the actual text.
- The number of asterisks displayed is determined by the `length` prop.
- If an invalid `length` is provided, the component will fall back to `SensitiveTextLength.Short` and log a warning.
- Custom length values can be provided as strings, e.g., "15".
- The component forwards refs to the underlying Text component.
- Additional props are passed through to the Text component.

## SensitiveTextLength Options

The following predefined length options are available:

- `SensitiveTextLength.Short`: '6'
- `SensitiveTextLength.Medium`: '9'
- `SensitiveTextLength.Long`: '12'
- `SensitiveTextLength.ExtraLong`: '20'

You can import these options from `./sensitive-text.types`.