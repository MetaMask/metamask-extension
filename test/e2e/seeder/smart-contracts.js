/*
 * Smart contract information used for Ganache seeding (initial local blockchain state)
 */
const hstFactory = require('./contracts/hst-factory');
const collectiblesFactory = require('./contracts/collectibles-factory');
const piggybankFactory = require('./contracts/piggybank-factory');
const failingContract = require('./contracts/failing-contract');

const contractConfiguration = {
  hst: hstFactory,
  collectibles: collectiblesFactory,
  piggybank: piggybankFactory,
  failing: failingContract,
};

module.exports = { contractConfiguration };
