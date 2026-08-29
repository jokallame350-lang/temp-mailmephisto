/**
 * MephistoMail Production Audit Script
 * 
 * Standalone, comprehensive audit script that runs:
 * 1. TypeScript typecheck (`tsc -b`)
 * 2. ESLint static analysis check (`eslint . --max-warnings 0`)
 * 3. Unit & Integration test suite (`tsx --test scripts/unit-tests.ts`)
 * 4. Live external smoke test (`tsx scripts/smoke-test.ts`)
 * 5. Production build (`tsc -b && vite build`)
 * 
 * Prints a formatted terminal summary report with execution times and pass/fail statuses.
 */

import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';

interface AuditStep {
  id: string;
  stepNumber: number;
  title: string;
  command: string;
  args: string[];
}

interface AuditResult {
  stepNumber: number;
  title: string;
  command: string;
  success: boolean;
  durationMs: number;
  errorOutput?: string;
}

const AUDIT_STEPS: AuditStep[] = [
  {
    id: 'typecheck',
    stepNumber: 1,
    title: 'TypeScript Typecheck',
    command: 'npx',
    args: ['tsc', '-b'],
  },
  {
    id: 'eslint',
    stepNumber: 2,
    title: 'ESLint Static Analysis',
    command: 'npx',
    args: ['eslint', '.', '--max-warnings', '0'],
  },
  {
    id: 'unit_tests',
    stepNumber: 3,
    title: 'Unit & Integration Test Suite',
    command: 'npx',
    args: ['tsx', '--test', 'scripts/unit-tests.ts'],
  },
  {
    id: 'smoke_test',
    stepNumber: 4,
    title: 'Live External Smoke Test',
    command: 'npx',
    args: ['tsx', 'scripts/smoke-test.ts'],
  },
  {
    id: 'prod_build',
    stepNumber: 5,
    title: 'Production Vite Build',
    command: 'npm',
    args: ['run', 'build'],
  },
];

function runCommand(command: string, args: string[]): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
    });

    let combinedOutput = '';

    child.stdout?.on('data', (data) => {
      const text = data.toString();
      combinedOutput += text;
      process.stdout.write(text);
    });

    child.stderr?.on('data', (data) => {
      const text = data.toString();
      combinedOutput += text;
      process.stderr.write(text);
    });

    child.on('error', (err) => {
      combinedOutput += `\nProcess error: ${err.message}`;
      resolve({ success: false, output: combinedOutput });
    });

    child.on('close', (code) => {
      resolve({ success: code === 0, output: combinedOutput });
    });
  });
}

async function runProductionAudit(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                   MephistoMail Comprehensive Production Audit                ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  const totalStart = performance.now();
  const results: AuditResult[] = [];
  let allPassed = true;

  for (const step of AUDIT_STEPS) {
    const fullCommandStr = `${step.command} ${step.args.join(' ')}`;
    console.log(`\n────────────────────────────────────────────────────────────────────────────────`);
    console.log(`▶ [Step ${step.stepNumber}/${AUDIT_STEPS.length}] ${step.title}`);
    console.log(`  Executing: ${fullCommandStr}`);
    console.log(`────────────────────────────────────────────────────────────────────────────────\n`);

    const stepStart = performance.now();
    const { success, output } = await runCommand(step.command, step.args);
    const durationMs = Math.round(performance.now() - stepStart);

    results.push({
      stepNumber: step.stepNumber,
      title: step.title,
      command: fullCommandStr,
      success,
      durationMs,
      errorOutput: success ? undefined : output.slice(-500),
    });

    if (success) {
      console.log(`\n✔ [Step ${step.stepNumber}/${AUDIT_STEPS.length}] ${step.title} PASSED (${durationMs}ms)`);
    } else {
      console.error(`\n✖ [Step ${step.stepNumber}/${AUDIT_STEPS.length}] ${step.title} FAILED (${durationMs}ms)`);
      allPassed = false;
    }
  }

  const totalDurationSec = ((performance.now() - totalStart) / 1000).toFixed(2);

  // Print Summary Report Table
  console.log('\n════════════════════════════════════════════════════════════════════════════════');
  console.log('                        PRODUCTION AUDIT SUMMARY REPORT                         ');
  console.log('════════════════════════════════════════════════════════════════════════════════');

  for (const r of results) {
    const statusIcon = r.success ? '✅ PASS' : '❌ FAIL';
    const num = `[${r.stepNumber}/5]`;
    const titlePadded = r.title.padEnd(32, ' ');
    const timeFormatted = `(${r.durationMs}ms)`.padStart(10, ' ');
    console.log(` ${statusIcon} | ${num} ${titlePadded} ${timeFormatted}`);
    if (!r.success && r.errorOutput) {
      console.log(`        ↳ Error Snippet: ${r.errorOutput.trim().split('\n').pop() || 'Unknown failure'}`);
    }
  }

  console.log('────────────────────────────────────────────────────────────────────────────────');
  const passCount = results.filter((r) => r.success).length;
  console.log(` 🎯 Result: ${passCount}/${AUDIT_STEPS.length} AUDIT CHECKS PASSED (Total Time: ${totalDurationSec}s)`);

  if (allPassed) {
    console.log(' 🎉 PRODUCTION READY - ZERO REGRESSIONS DETECTED');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.error(' 💥 PRODUCTION AUDIT FAILED - PLEASE RESOLVE ERRORS BEFORE RELEASE');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

runProductionAudit().catch((err) => {
  console.error('Fatal unhandled error during production audit:', err);
  process.exit(1);
});
