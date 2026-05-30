#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
global.window = global;
global.navigator = { language: 'en-US' };
global.chrome = undefined;
require(path.join(__dirname, '..', 'extension', 'core.js'));
const input = process.argv[2];
if (!input) {
  console.error('usage: node scripts/export_extension_csv.js <events.csv>');
  process.exit(2);
}
const csv = fs.readFileSync(input, 'utf8');
const events = global.LDT_Core.csvToEvents(csv);
process.stdout.write(global.LDT_Core.eventsToCSV(events));
