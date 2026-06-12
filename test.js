#!/usr/bin/env node
/**
 * test.js — validate every example document against the convention schema.
 *
 * Discovers all `.json` files in examples/ and runs `validate.js` on each one,
 * checking them against `schema.json`. Prints a per-file pass/fail line and a
 * summary, then exits non-zero if any example failed (so it can gate CI).
 *
 * Usage:
 *   node test.js      (or: npm test)
 */
import { readdir } from 'fs/promises';
import { join, extname } from 'path';
import { execSync } from 'child_process';

const examplesDir = 'examples';
const schemaFile = 'schema.json';

async function runTests() {
  console.log('🧪 Running validation tests...\n');

  try {
    // Collect every .json file in the examples directory.
    const files = await readdir(examplesDir);
    const jsonFiles = files.filter((file) => extname(file) === '.json');

    if (jsonFiles.length === 0) {
      console.log('⚠️  No JSON files found in examples directory');
      process.exit(1);
    }

    let passed = 0;
    let failed = 0;

    // Validate each example by shelling out to validate.js. Using a separate
    // process per file keeps one failure from aborting the whole run.
    for (const file of jsonFiles) {
      const filePath = join(examplesDir, file);
      process.stdout.write(`Testing ${file}... `);

      try {
        // Throws if validate.js exits non-zero (i.e. the example is invalid).
        execSync(`node validate.js ${schemaFile} ${filePath}`, {
          stdio: 'pipe',
          encoding: 'utf8',
        });
        console.log('✅ PASSED');
        passed++;
      } catch (error) {
        console.log('❌ FAILED');
        // Surface validate.js's output (the Ajv errors) so the failure is actionable.
        console.log(error.stdout || error.message);
        failed++;
      }
    }

    // Print a summary and fail the run if any example did not validate.
    console.log('\n' + '='.repeat(50));
    console.log(`Total: ${jsonFiles.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log('='.repeat(50));

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running tests:', error.message);
    process.exit(1);
  }
}

runTests();
