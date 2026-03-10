/**
 * Set permissive CORS headers on a response.
 *
 * @param {import('http').ServerResponse} response
 */
function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, DELETE, OPTIONS',
  );
  response.setHeader('Access-Control-Allow-Headers', '*');
}

/**
 * Send a JSON response with CORS headers.
 *
 * @param {import('http').ServerResponse} response
 * @param {number} statusCode
 * @param {unknown} body - JSON-serialisable value
 */
function jsonResponse(response, statusCode, body) {
  setCorsHeaders(response);
  response.setHeader('Content-Type', 'application/json');
  response.statusCode = statusCode;
  response.end(JSON.stringify(body, null, 2));
}

/**
 * Human-readable label for a Segment event type.
 *
 * @param {object} event - Segment event
 * @returns {string}
 */
function getTypeLabel(event) {
  switch (event.type) {
    case 'track':
      return 'Track';
    case 'page':
      return 'Page';
    case 'identify':
      return 'Identify';
    default:
      return 'Unknown';
  }
}

/**
 * Event name (track/page) or user/anonymous ID (identify).
 *
 * @param {object} event - Segment event
 * @returns {string}
 */
function getNameOrId(event) {
  switch (event.type) {
    case 'track':
      return event.event || '(no name)';
    case 'page':
      return event.name || '(no name)';
    case 'identify':
      return event.userId || event.anonymousId || '(no id)';
    default:
      return `[Unrecognized event type: ${event.type}]`;
  }
}

/**
 * Return the properties (or traits for identify events) attached to an event.
 *
 * @param {object} event - Segment event
 * @returns {object | undefined}
 */
function getEventProperties(event) {
  return event.type === 'identify' ? event.traits : event.properties;
}

/**
 * Log a Segment event to the console.
 *
 * @param {string} prefix - Log line prefix, e.g. "[mock-segment]"
 * @param {object} event  - Segment event
 */
function logSegmentEvent(prefix, event) {
  const properties = getEventProperties(event);
  const hasProperties =
    properties &&
    typeof properties === 'object' &&
    Object.keys(properties).length > 0;
  const label = getTypeLabel(event);
  const nameOrId = getNameOrId(event);

  if (hasProperties) {
    console.log(
      `${prefix} ${label}: ${nameOrId}\n${JSON.stringify(properties, null, 2)}`,
    );
  } else {
    console.log(`${prefix} ${label}: ${nameOrId}`);
  }
}

module.exports = {
  setCorsHeaders,
  jsonResponse,
  getTypeLabel,
  getNameOrId,
  getEventProperties,
  logSegmentEvent,
};
