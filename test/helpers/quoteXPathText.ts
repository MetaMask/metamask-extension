/**
 * Quote text so it can be used in an xpath expression,
 * often used to locate an element by its text.
 *
 * @param s - The text to quote. May contain single or double quotes.
 * @returns The quoted text.
 */
export function quoteXPathText(s: string = '') {
  if (!s.includes('"')) {
    return `"${s}"`;
  }
  if (!s.includes("'")) {
    return `'${s}'`;
  }
  // If it's really necessary to escape both, you can use the concat function.
  // Something like: return `concat('${s.replace(/'/g, "',\"'\",'')}')`;
  throw new Error('The text should not contain both single and double quotes');
}
