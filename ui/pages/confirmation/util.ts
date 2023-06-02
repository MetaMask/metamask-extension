import { UIComponent } from '@metamask/approval-controller';

export function processError(
  input: undefined | string | UIComponent | UIComponent[],
  fallback: string,
): UIComponent | (string | UIComponent)[] {
  let currentInput = input;

  if (!currentInput) {
    currentInput = fallback;
  }

  if (!(typeof currentInput === 'string')) {
    return currentInput;
  }

  return {
    key: 'error',
    element: 'ActionableMessage',
    props: { type: 'danger', message: currentInput },
  };
}

export function processString(
  input: undefined | string | UIComponent | UIComponent[],
  fallback: string,
): string | UIComponent | (string | UIComponent)[] {
  let currentInput = input;

  if (!currentInput) {
    currentInput = fallback;
  }

  if (!(typeof currentInput === 'string')) {
    return currentInput;
  }

  return applyBold(currentInput);
}

export function applyBold(message: string): (string | UIComponent)[] {
  const boldPattern = /\*\*(.+?)\*\*/gu;

  return findMarkdown(message, boldPattern, (formattedText, index) => ({
    key: `bold-${index}`,
    element: 'b',
    children: formattedText,
  }));
}

export function findMarkdown(
  text: string,
  pattern: RegExp,
  getElement: (formattedText: string, index: number) => UIComponent,
): (string | UIComponent)[] {
  let position = 0;
  let index = 0;

  const matches = Array.from(text.matchAll(pattern));
  const elements = [];

  for (const match of matches) {
    const rawText = text.substring(position, match.index);

    if (rawText.length) {
      elements.push(rawText);
    }

    const formattedText = match[1];
    const formattedElement = getElement(formattedText, index);

    elements.push(formattedElement);

    position = (match.index as number) + match[0].length;
    index += 1;
  }

  const finalRawText = text.substring(position);

  if (finalRawText.length) {
    elements.push(finalRawText);
  }

  return elements;
}
