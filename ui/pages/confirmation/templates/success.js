import {
  FontWeight,
  TextAlign,
  BlockSize,
  AlignItems,
  FlexDirection,
  JustifyContent,
  TypographyVariant,
} from '../../../helpers/constants/design-system';

function getValues(pendingApproval, t, actions, _history) {
  return {
    content: [
      {
        key: 'container',
        element: 'Box',
        props: {
          flexDirection: FlexDirection.Column,
          alignItems: AlignItems.center,
          justifyContent: JustifyContent.center,
          height: BlockSize.Full,
          paddingTop: 2,
          paddingBottom: 2,
        },
        children: [
          {
            key: 'heading',
            element: 'Typography',
            props: {
              variant: TypographyVariant.H3,
              fontWeight: FontWeight.Bold,
              paddingBottom: 2,
            },
            children: 'Success',
          },
          {
            key: 'message',
            element: 'Typography',
            props: {
              textAlign: TextAlign.Center,
            },
            children: processMessage(pendingApproval.requestData.message),
          },
        ],
      },
    ],
    submitText: t('ok'),
    onSubmit: () =>
      actions.resolvePendingApproval(
        pendingApproval.id,
        pendingApproval.requestData,
      ),
    networkDisplay: false,
  };
}

function processMessage(message) {
  if (!message) {
    return 'The operation completed successfully.';
  }

  // Support for element or array of elements
  if (!(typeof message === 'string')) {
    return message;
  }

  return applyBold(message);
}

function applyBold(message) {
  const boldPattern = /\*\*(.+?)\*\*/gu;

  return findMarkdown(message, boldPattern, (formattedText, index) => ({
    key: `bold-${index}`,
    element: 'b',
    children: formattedText,
  }));
}

function findMarkdown(text, pattern, getElement) {
  const elements = [];
  let position = 0;
  let index = 0;

  for (const match of text.matchAll(pattern)) {
    const rawText = text.substring(position, match.index);

    if (rawText.length) {
      elements.push(rawText);
    }

    const formattedText = match[1];
    const formattedElement = getElement(formattedText, index);

    elements.push(formattedElement);

    position = match.index + match[0].length;
    index += 1;
  }

  const finalRawText = text.substring(position);

  if (finalRawText.length) {
    elements.push(finalRawText);
  }

  return elements;
}

const success = {
  getValues,
};

export default success;
