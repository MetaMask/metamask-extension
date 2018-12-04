function getTimeBreakdown (milliseconds) {
  return {
    hours: Math.floor(milliseconds / 3600000),
    minutes: Math.floor((milliseconds % 3600000) / 60000),
    seconds: Math.floor((milliseconds % 60000) / 1000),
  }
}

module.exports = {
  getTimeBreakdown,
}
