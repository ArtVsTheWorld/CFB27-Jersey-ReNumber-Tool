// Open/save helper for CFB27 franchise saves. Exposes small utilities used
// across the tool: `openSave`, `readTable`, ref encode/parse, and a
// safe-field accessor. Keeps original behavior; formatting tightened.
const path = require('path');
const Franchise = require("madden-franchise").default || require("madden-franchise");

const SCHEMA_DIR = process.env.RG_SCHEMA_DIR || path.join(__dirname, "..", "engine-data");
const SCHEMA_OVERRIDE = () => ({ major: 468, minor: 2, gameYear: 27, path: path.join(SCHEMA_DIR, 'C27_468_2.gz') });

async function openSave(savePath) { return Franchise.create(savePath, { schemaDirectory: SCHEMA_DIR, schemaOverride: SCHEMA_OVERRIDE() }); }

function tableByUniqueId(file, uniqueId) {
    const table = file.tables.find(t => t.uniqueId === uniqueId || t.header?.uniqueId === uniqueId);
    if (!table) throw new Error(`Table ${uniqueId} not found`);
    return table;
}

async function readTable(file, uniqueId) { const t = tableByUniqueId(file, uniqueId); await t.readRecords(); return t; }

function parseRef(bin) { if (typeof bin !== 'string' || bin.length < 32 || !/[1-9]/.test(bin)) return null; return { tableId: parseInt(bin.slice(0, 15), 2), row: parseInt(bin.slice(15), 2) }; }

function makeRef(tableId, row) { return tableId.toString(2).padStart(15, '0') + row.toString(2).padStart(17, '0'); }

const sf = (rec, field) => { try { return rec[field]; } catch { return undefined; } };

module.exports = { openSave, tableByUniqueId, readTable, parseRef, makeRef, sf, SCHEMA_DIR };
