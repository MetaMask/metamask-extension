const path = require('path')
const audit = require(path.join(__dirname, '..', '..', 'audit.json'))
const error = audit.error
const advisories = Object.keys(audit.advisories || []).map((k) => audit.advisories[k])

if (error) {
  process.exit(1)
}

let count = 0
for (const advisory of advisories) {
  if (advisory.severity === 'low') {
    continue
  }

  count += advisory.findings.some((finding) => (!finding.dev && !finding.optional))
}

if (count > 0) {
  console.log(`Audit shows ${count} moderate or high severity advisories _in the production dependencies_`)
  process.exit(1)
} else {
  console.log(`Audit shows _zero_ moderate or high severity advisories _in the production dependencies_`)
}
