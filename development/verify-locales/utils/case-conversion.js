const { sentenceCaseExceptions, containsSpecialCase } = require('./exceptions');

/**
 * Simple sentence case conversion
 * @param {string} text - Text to convert
 * @returns {string} Sentence case text
 */
function convertToSentenceCase(text) {
  if (!text) {
    return text;
  }

  // Extract quoted text (single quotes and escaped double quotes) and preserve them
  const quotedTexts = [];
  let textToProcess = text;
  let placeholderIndex = 0;

  // Find all single-quoted text and replace with unique placeholders
  textToProcess = textToProcess.replace(/'([^']*)'/gu, (match) => {
    const uniquePlaceholder = `___QUOTED_${placeholderIndex}___`;
    quotedTexts.push({ placeholder: uniquePlaceholder, text: match });
    placeholderIndex += 1;
    return uniquePlaceholder;
  });

  // Find all escaped double-quoted text and replace with unique placeholders
  textToProcess = textToProcess.replace(/\\"([^"]*)\\"/gu, (match) => {
    const uniquePlaceholder = `___QUOTED_${placeholderIndex}___`;
    quotedTexts.push({ placeholder: uniquePlaceholder, text: match });
    placeholderIndex += 1;
    return uniquePlaceholder;
  });

  // Convert to sentence case
  const words = textToProcess.split(/\s+/u).filter((word) => word.length > 0);
  let converted = words
    .map((word, index) => {
      // Check if word contains a placeholder (exact match or with punctuation)
      if (
        quotedTexts.some(
          (q) => word === q.placeholder || word.includes(q.placeholder),
        )
      ) {
        return word;
      }
      if (index === 0) {
        // First word: capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      // Other words: all lowercase
      return word.toLowerCase();
    })
    .join(' ');

  // Restore quoted text with unique placeholders
  quotedTexts.forEach(({ placeholder, text: quotedText }) => {
    converted = converted.replace(placeholder, quotedText);
  });

  return converted;
}

/**
 * Convert to sentence case while preserving special cases
 * @param {string} text - Text to convert
 * @returns {string} Sentence case text with special cases preserved
 */
function toSentenceCase(text) {
  // If text contains special cases, we need to be careful
  if (containsSpecialCase(text)) {
    // Build a map of special terms and their positions
    const specialTerms = [];

    // Find all special terms from exact matches
    for (const term of sentenceCaseExceptions.exactMatches) {
      let index = text.indexOf(term);
      while (index !== -1) {
        specialTerms.push({ term, start: index, end: index + term.length });
        index = text.indexOf(term, index + 1);
      }
    }

    // Find all acronyms
    for (const acronym of sentenceCaseExceptions.acronyms) {
      let index = text.indexOf(acronym);
      while (index !== -1) {
        specialTerms.push({
          term: acronym,
          start: index,
          end: index + acronym.length,
        });
        index = text.indexOf(acronym, index + 1);
      }
    }

    // Sort by position first, then by length descending (prefer longer matches)
    // This ensures overlapping terms like "MetaMask Portfolio" are processed before "MetaMask"
    specialTerms.sort((a, b) => {
      if (a.start !== b.start) {
        return a.start - b.start;
      }
      // If same start position, prefer longer match
      return b.end - b.start - (a.end - a.start);
    });

    // Build result preserving special terms
    let result = '';
    let lastIndex = 0;

    for (const special of specialTerms) {
      // Skip overlapping terms (already covered by a previous term)
      if (special.start < lastIndex) {
        continue;
      }

      // Process text before this special term
      const before = text.substring(lastIndex, special.start);
      if (before) {
        result += convertToSentenceCase(before);
      }
      // Add the special term as-is
      result += special.term;
      lastIndex = special.end;
    }

    // Process remaining text
    if (lastIndex < text.length) {
      result += convertToSentenceCase(text.substring(lastIndex));
    }

    return result;
  }

  return convertToSentenceCase(text);
}

module.exports = {
  convertToSentenceCase,
  toSentenceCase,
};
