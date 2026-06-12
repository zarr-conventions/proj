#!/usr/bin/env node
/**
 * validate.js — validate a single JSON document against a JSON Schema.
 *
 * Used by the `proj` convention to check that an example document conforms to
 * `schema.json`. The schema references the external PROJJSON schema, so this
 * script fetches that schema over the network and registers it with Ajv before
 * compiling.
 *
 * Usage:
 *   node validate.js <schema.json> <data.json>
 *
 * Exit codes:
 *   0  document is valid
 *   1  invalid arguments, or the document failed validation
 *
 * Run `npm test` to validate every file in examples/ at once.
 */
import Ajv from 'ajv';
import fs from 'fs';

// --- Parse arguments -------------------------------------------------------
const schemaPath = process.argv[2];
const dataPath = process.argv[3];

if (!schemaPath || !dataPath) {
  console.error('Usage: node validate.js <schema.json> <data.json>');
  console.error('Example: node validate.js schema.json examples/epsg3587.json');
  process.exit(1);
}

// --- Load the schema and the document to validate --------------------------
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// `allErrors: true` reports every validation failure, not just the first one,
// which makes example fixtures easier to debug.
const ajv = new Ajv({ allErrors: true });

// schema.json references the PROJJSON schema by URL ($ref). Ajv does not fetch
// remote schemas on its own, so we download it and register it under the same
// URL the $ref uses, allowing Ajv to resolve the reference locally.
const externalSchemaUrl = 'https://proj.org/schemas/v0.7/projjson.schema.json';
const externalSchema = await fetch(externalSchemaUrl).then((r) => r.json());
ajv.addSchema(externalSchema, externalSchemaUrl);

// --- Validate --------------------------------------------------------------
const validate = ajv.compile(schema);
const valid = validate(data);

if (valid) {
  console.log('✅ Validation successful!');
  process.exit(0);
} else {
  console.log('❌ Validation failed!');
  // validate.errors is an array of Ajv error objects describing each failure.
  console.log(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}
