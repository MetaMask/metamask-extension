'use strict';

const { RuleTester } = require('eslint');
const { parser: tsParser } = require('typescript-eslint');
const rule = require('./no-inline-api-mock-body');

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-inline-api-mock-body', rule, {
  valid: [
    {
      name: 'thenJson with a fixture reference',
      code: 'server.forGet(url).thenJson(200, API_RESPONSES["price-v3-spot-prices"]);',
    },
    {
      name: 'thenJson with a builder call',
      code: 'server.forGet(url).thenJson(200, buildSpotPrice({ price: 1 }));',
    },
    {
      name: 'thenCallback json property is a fixture',
      code: `server.forGet(url).thenCallback(() => ({
        statusCode: 200,
        json: API_RESPONSES['gas-prices'],
      }));`,
    },
    {
      name: 'thenCallback block returns a builder result',
      code: `server.forGet(url).thenCallback(() => {
        return { statusCode: 200, json: buildGasPrices() };
      });`,
    },
    {
      name: 'headers object next to a fixture body is allowed',
      code: `server.forGet(url).thenCallback(() => ({
        statusCode: 200,
        json: fixture,
        headers: { 'content-type': 'application/json' },
      }));`,
    },
    {
      name: 'withJsonBody matches the request, not the response',
      code: 'server.forPost(url).withJsonBody({ chainIds: ["eip155:1"] });',
    },
    {
      name: 'thenJson headers are not the body',
      code: 'server.forGet(url).thenJson(200, fixture, { "content-type": "application/json" });',
    },
  ],
  invalid: [
    {
      name: 'thenJson object literal',
      code: 'server.forGet(url).thenJson(200, { fullSupport: [] });',
      errors: [{ messageId: 'inlineBody' }],
    },
    {
      name: 'thenJson array literal',
      code: 'server.forGet(url).thenJson(200, []);',
      errors: [{ messageId: 'inlineBody' }],
    },
    {
      name: 'thenCallback expression returns an inline json body',
      code: `server.forGet(url).thenCallback(() => ({
        statusCode: 200,
        json: { price: 1 },
      }));`,
      errors: [{ messageId: 'inlineBody' }],
    },
    {
      name: 'thenCallback block returns an inline json body',
      code: `server.forGet(url).thenCallback(async (request) => {
        return { statusCode: 200, json: [{ symbol: 'ETH' }] };
      });`,
      errors: [{ messageId: 'inlineBody' }],
    },
    {
      name: 'conditional branch with an inline json body',
      code: `server.forGet(url).thenCallback(() => ({
        json: ready ? fixture : { price: 0 },
      }));`,
      errors: [{ messageId: 'inlineBody' }],
    },
    {
      name: 'json variable assigned an object literal inside the callback',
      code: `server.forGet(url).thenCallback(() => {
        const json = { price: 1 };
        return { statusCode: 200, json };
      });`,
      errors: [{ messageId: 'inlineBody' }],
    },
  ],
});
