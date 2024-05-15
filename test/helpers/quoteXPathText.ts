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
