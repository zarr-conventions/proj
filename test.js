#!/usr/bin/env node
/**
 * test.js — validate every example document against the convention schema.
 *
 * Discovers all `.json` files in examples/ and runs `validate.js` on each one,
 * checking them against `schema.json`. Then does the same for tests/invalid/,
 * where each document must fail validation. Prints a per-file pass/fail line
 * and a summary, then exits non-zero if any file gave an unexpected result (so
 * it can gate CI).
 *
 * Usage:
 *   node test.js      (or: npm test)
 */
import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { execSync } from 'child_process';

const examplesDir = 'examples';
const invalidDir = 'tests/invalid';
const schemaFile = 'schema.json';

// In draft-07, a validator must ignore every keyword that is in the same object
// as `$ref`. Ajv applies these keywords, so a constraint next to `$ref` passes
// the tests here but has no effect in a strict validator. Fail early if the
// schema has one. Use `allOf: [{ "$ref": ... }]` to combine constraints.
const annotationKeywords = ['$ref', '$comment', 'title', 'description'];

function findRefSiblings(node, path = '#') {
  if (Array.isArray(node)) {
    return node.flatMap((item, i) => findRefSiblings(item, `${path}/${i}`));
  }
  if (node === null || typeof node !== 'object') {
    return [];
  }
  const found = Object.entries(node).flatMap(([key, value]) =>
    findRefSiblings(value, `${path}/${key}`)
  );
  if ('$ref' in node) {
    const siblings = Object.keys(node).filter(
      (key) => !annotationKeywords.includes(key)
    );
    if (siblings.length > 0) {
      found.push(`${path}: ${siblings.join(', ')}`);
    }
  }
  return found;
}

async function runTests() {
  console.log('🧪 Running validation tests...\n');

  try {
    const refSiblings = findRefSiblings(
      JSON.parse(await readFile(schemaFile, 'utf8'))
    );
    if (refSiblings.length > 0) {
      console.log('❌ Keywords next to $ref are ignored in draft-07:');
      refSiblings.forEach((line) => console.log(`   ${line}`));
      process.exit(1);
    }

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

    // Each document in tests/invalid/ must fail validation.
    const invalidFiles = (await readdir(invalidDir)).filter((file) => extname(file) === '.json');

    for (const file of invalidFiles) {
      const filePath = join(invalidDir, file);
      process.stdout.write(`Testing ${file} (must be invalid)... `);

      try {
        execSync(`node validate.js ${schemaFile} ${filePath}`, {
          stdio: 'pipe',
          encoding: 'utf8',
        });
        console.log('❌ FAILED (the document is valid)');
        failed++;
      } catch {
        console.log('✅ PASSED');
        passed++;
      }
    }

    // Print a summary and fail the run if any file gave an unexpected result.
    const total = jsonFiles.length + invalidFiles.length;
    console.log('\n' + '='.repeat(50));
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
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
