import { ApprovalType } from '@metamask/controller-utils';
import { ResultComponent } from '@metamask/approval-controller';
import metamaskTemplateRenderer from '../../../components/app/metamask-template-renderer';


export type TemplateRendererComponent = {
  key: string;
  element: string;
  props?: Record<string, unknown>;
  children?:
    | string
    | TemplateRendererComponent
    | (undefined | string | TemplateRendererComponent)[];
};

/**
 * Type of result page being shown.
 */
export type ResultType = ApprovalType.ResultSuccess | ApprovalType.ResultError;

/**
 * Context of a ResultTemplate. This can be used by its children/templates to get
 * information about the result page being used.
 */
export type ResultContext = {
  type: ResultType;
  onSubmit: Promise<void>;
};

/**
 * Processes an error message or ResultComponent and returns a TemplateRendererComponent
 * or an array of strings | TemplateRendererComponents.
 *
 * @param input - The message or component to process.
 * @param fallback - The fallback message to use when the input is not valid.
 * @returns The processed error component.
 */
export function processError(
  input: undefined | string | ResultComponent | ResultComponent[],
  fallback: string,
): TemplateRendererComponent | (string | TemplateRendererComponent)[] {
  const currentInput = convertResultComponents(input) || fallback;

  if (typeof currentInput !== 'string') {
    return currentInput;
  }

  return {
    key: 'error',
    element: 'ActionableMessage',
    props: { type: 'danger', message: currentInput },
  };
}

/**
 * Processes a string or ResultComponent and returns a string or TemplateRendererComponent
 * or an array of strings | TemplateRendererComponents.
 *
 * @param input - The message or component to process.
 * @param fallback - The fallback string to use when the input is not valid.
 * @returns The processed message.
 */
export function processString(
  input: undefined | string | ResultComponent | ResultComponent[],
  fallback: string,
): string | TemplateRendererComponent | (string | TemplateRendererComponent)[] {
  const currentInput = convertResultComponents(input) || fallback;

  if (typeof currentInput !== 'string') {
    return currentInput;
  }

  return applyBold(currentInput);
}

/**
 * Processes a header configuration and returns a value compatible with the template renderer.
 *
 * @param header - The header configuration to process.
 * @returns The processed header.
 */
export function processHeader(
  header: (string | ResultComponent)[] | undefined,
) {
  return convertResultComponents(header) as
    | undefined
    | (string | TemplateRendererComponent)[];
}

/**
 * Applies bold formatting to the message.
 *
 * @param message - The input message to apply bold formatting to.
 * @returns The formatted message.
 */
function applyBold(message: string): (string | TemplateRendererComponent)[] {
  const boldPattern = /\*\*(.+?)\*\*/gu;

  return findMarkdown(message, boldPattern, (formattedText, index) => ({
    key: `bold-${index}`,
    element: 'b',
    children: formattedText,
  }));
}

/**
 * Finds and formats markdown elements in the given text.
 *
 * @param text - The input text to search for markdown elements.
 * @param pattern - The pattern to match the markdown elements.
 * @param getElement - The callback function to create the formatted elements.
 * @returns The array of formatted elements.
 */
function findMarkdown(
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

/**
 * Attach (or inject) a ResultContext to every underlying children of a ResultTemplate
 * component.
 *
 * @param input - The component(s) to update.
 * @param resultContext - The context being injected.
 * @returns The updated component(s).
 */
export function attachResultContext(
  input:
    | undefined
    | string
    | TemplateRendererComponent
    | (undefined | string | TemplateRendererComponent)[],
  resultContext: ResultContext,
): string | TemplateRendererComponent | (string | TemplateRendererComponent)[] {
  // TemplateRendererComponent's children might be undefined
  if (input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((x) => attachResultContext(x, resultContext)) as (
      | undefined
      | string
      | TemplateRendererComponent
    )[];
  }

  if (input.props?.resultContext) {
    throw new Error(
      'Children of a ResultTemplate cannot have manually bound .resultContext property',
    );
  }

  return {
    key: input.key,
    element: input.element,
    props: {
      ...input.props,
      resultContext,
    },
    children: attachResultContext(input.children, resultContext),
  };
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
    return input.map(convertResultComponents) as (
      | string
      | TemplateRendererComponent
    )[];
  }

  return {
    key: input.key,
    element: input.name,
    props: input.properties,
    children: convertResultComponents(input.children),
  };
}
