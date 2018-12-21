
function isLedger (device) {
	return device && device.toLowerCase().includes('ledger')
}

module.exports = {
	isLedger,
}
