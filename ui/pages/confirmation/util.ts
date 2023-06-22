import { ResultComponent } from '@metamask/approval-controller';

type TemplateRendererComponent = {
  key: string;
  element: string;
  props?: Record<string, unknown>;
  children?:
    | string
    | TemplateRendererComponent
    | (string | TemplateRendererComponent)[];
};

export function processError(
  input: undefined | string | ResultComponent | ResultComponent[],
  fallback: string,
): TemplateRendererComponent | (string | TemplateRendererComponent)[] {
  let currentInput = convertResultComponents(input);

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
  input: undefined | string | ResultComponent | ResultComponent[],
  fallback: string,
): string | TemplateRendererComponent | (string | TemplateRendererComponent)[] {
  let currentInput = convertResultComponents(input);

  if (!currentInput) {
    currentInput = fallback;
  }

  if (!(typeof currentInput === 'string')) {
    return currentInput;
  }

  return applyBold(currentInput);
}

export function applyBold(
  message: string,
): (string | TemplateRendererComponent)[] {
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
  getElement: (
    formattedText: string,
    index: number,
  ) => TemplateRendererComponent,
): (string | TemplateRendererComponent)[] {
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

function convertResultComponents(
  input: undefined | string | ResultComponent | (string | ResultComponent)[],
):
  | undefined
  | string
  | TemplateRendererComponent
  | (string | TemplateRendererComponent)[] {
  if (input === undefined) {
    return undefined;
  }

  if (typeof input === 'string') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(convertResultComponents) as any;
  }

  return {
    key: input.key,
    element: input.name,
    props: input.properties,
    children: convertResultComponents(input.children),
  };
}
