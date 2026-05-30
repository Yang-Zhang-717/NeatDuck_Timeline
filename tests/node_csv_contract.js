const fs = require('fs');
global.window = global;
require('../extension/core.js');
const rows = JSON.parse(fs.readFileSync(__dirname + '/csv_contract_events.json', 'utf8'));
function event(r){ return {
  uid:r.uid, title:r.title, shortTitle:r.shortTitle, category:r.category, lane:r.lane, sub:r.sub,
  start:r.start ? new Date(r.start) : null, endKnown:r.endKnown ? new Date(r.endKnown) : null, endInferred:r.endInferred ? new Date(r.endInferred) : null,
  href:r.href, timeZone:r.timeZone, timeZoneLabel:r.timeZoneLabel, isFixedTimeZone:r.isFixedTimeZone === 'true',
  source:r.source, firstSeenAt:r.firstSeenAt, lastSeenAt:r.lastSeenAt, lastScrapedAt:r.lastScrapedAt, status:r.status
};}
fs.writeFileSync(process.argv[2] || 'node_events.csv', LDT_Core.eventsToCSV(rows.map(event)), 'utf8');
