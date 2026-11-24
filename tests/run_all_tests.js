import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUITES = [
  { name: 'Phase 3: WhatsApp Webhook Suite', file: 'webhook_suite.js' },
  { name: 'Phase 4: Gemini AI Grounding Suite', file: 'gemini_suite.js' },
  { name: 'Phase 5: Conversation Memory Suite', file: 'memory_suite.js' },
  { name: 'Phase 6: Customer Lead Capture Suite', file: 'lead_suite.js' },
  { name: 'Phase 7: Human Handoff & Escalation Suite', file: 'handoff_suite.js' },
  { name: 'Phase 8: Complete End-to-End Customer Journey', file: 'e2e_journey_suite.js' },
  { name: 'Phase 8: Webhook + Gemini AI Integration Suite', file: 'webhook_ai_suite.js' },
  { name: 'FAQ Expansion & Website Intelligence Suite', file: 'faq_expansion_suite.js' },
];

async function runSuite(suite) {
  const filePath = path.join(__dirname, suite.file);
  console.log(`\n================================================================`);
  console.log(`>>> EXECUTING SUITE: ${suite.name} (${suite.file})`);
  console.log(`================================================================\n`);

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [filePath], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });

    child.on('close', (code) => {
      resolve({ name: suite.name, file: suite.file, passed: code === 0, code });
    });

    child.on('error', (err) => {
      console.error(`Error running ${suite.file}:`, err);
      resolve({ name: suite.name, file: suite.file, passed: false, error: err.message });
    });
  });
}

async function runAll() {
  console.log('================================================================');
  console.log('    RELIABLE PAPER MART AI ASSISTANT — MASTER TEST RUNNER       ');
  console.log('================================================================');
  console.log(`Found ${SUITES.length} test suites. Starting sequential execution...\n`);

  const startTime = Date.now();
  const summary = [];

  for (const suite of SUITES) {
    const result = await runSuite(suite);
    summary.push(result);
    // Graceful pause between suites to ensure socket cleanup and smooth rate distribution
    await new Promise((r) => setTimeout(r, 2000));
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n\n================================================================');
  console.log('                     FINAL TEST SUMMARY                         ');
  console.log('================================================================');
  summary.forEach((s) => {
    const icon = s.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${icon}] ${s.name.padEnd(46)} (${s.file})`);
  });
  console.log('----------------------------------------------------------------');

  const passedCount = summary.filter((s) => s.passed).length;
  console.log(`Total Suites: ${summary.length} | Passed: ${passedCount} | Failed: ${summary.length - passedCount}`);
  console.log(`Duration: ${durationSec}s`);
  console.log('================================================================\n');

  if (passedCount !== summary.length) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('Master test runner encountered fatal error:', err);
  process.exit(1);
});
