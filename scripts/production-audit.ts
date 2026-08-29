/**
 * MephistoMail Production Audit Script
 * 
 * Standalone, comprehensive audit script that runs:
 * 1. TypeScript typecheck (`tsc -b`)
 * 2. ESLint static analysis check (`eslint . --max-warnings 0`)
 * 3. Unit & Integration test suite (`tsx --test scripts/unit-tests.ts`)
 * 4. Live External Smoke Test (`tsx scripts/smoke-test.ts`)
 * 5. Production Vite Build (`tsc -b && vite build`)
 * 6. Client Bundle Secret Scan (verifying PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET, and server secrets are absent from dist/)
 * 
 * Prints a formatted terminal summary report with execution times and pass/fail statuses.
 */

import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import path from 'node:path';

interface AuditStep {
  id: string;
  stepNumber: number;
  title: string;
  command?: string;
  args?: string[];
  customRunner?: () => Promise<{ success: boolean; output: string }>;
}

interface AuditResult {
  stepNumber: number;
  title: string;
  command: string;
  success: boolean;
  durationMs: number;
  errorOutput?: string;
}

function getAllFilesRecursively(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFilesRecursively(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function scanBundleSecrets(): Promise<{ success: boolean; output: string }> {
  const distDir = path.resolve(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    return {
      success: false,
      output: `dist directory does not exist at ${distDir}. Run production build first.`,
    };
  }

  const allFiles = getAllFilesRecursively(distDir);
  if (allFiles.length === 0) {
    return {
      success: false,
      output: 'dist directory is empty. No files found to scan.',
    };
  }

  // Forbidden patterns that must NEVER leak to client-side bundles
  const FORBIDDEN_PATTERNS = [
    { name: 'PADDLE_API_KEY environment reference', pattern: /PADDLE_API_KEY/g },
    { name: 'PADDLE_WEBHOOK_SECRET environment reference', pattern: /PADDLE_WEBHOOK_SECRET/g },
    { name: 'Paddle Webhook Secret (pdl_ntfset_...) live token', pattern: /pdl_ntfset_[a-zA-Z0-9_-]{20,}/g },
    { name: 'MAILBOX_ISSUER_SECRET environment reference', pattern: /MAILBOX_ISSUER_SECRET/g },
  ];

  const violations: string[] = [];
  let totalBytesScanned = 0;
  let filesScannedCount = 0;

  for (const filePath of allFiles) {
    // Only inspect text/code assets (.js, .css, .html, .map, .json, .txt)
    const ext = path.extname(filePath).toLowerCase();
    if (!['.js', '.css', '.html', '.map', '.json', '.txt'].includes(ext)) {
      continue;
    }

    filesScannedCount++;
    const content = fs.readFileSync(filePath, 'utf-8');
    totalBytesScanned += content.length;
    const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

    for (const { name, pattern } of FORBIDDEN_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(`[LEAK DETECTED] ${name} found in ${relPath}`);
      }
    }
  }

  if (violations.length > 0) {
    const errorMsg = violations.join('\n');
    return {
      success: false,
      output: `CRITICAL SECURITY LEAK: Client bundle secret scan failed!\n${errorMsg}`,
    };
  }

  return {
    success: true,
    output: `Bundle scan verified ${filesScannedCount} files (${(totalBytesScanned / 1024).toFixed(1)} KB). Zero backend secrets (PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET) found in client dist/ directory.`,
  };
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
  {
    id: 'secret_scan',
    stepNumber: 6,
    title: 'Client Bundle Secret Scan',
    customRunner: scanBundleSecrets,
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
    const fullCommandStr = step.customRunner
      ? 'Static secret scan across all dist/ production assets'
      : `${step.command} ${(step.args || []).join(' ')}`;

    console.log(`\n────────────────────────────────────────────────────────────────────────────────`);
    console.log(`▶ [Step ${step.stepNumber}/${AUDIT_STEPS.length}] ${step.title}`);
    console.log(`  Executing: ${fullCommandStr}`);
    console.log(`────────────────────────────────────────────────────────────────────────────────\n`);

    const stepStart = performance.now();
    let success = false;
    let output = '';

    if (step.customRunner) {
      const res = await step.customRunner();
      success = res.success;
      output = res.output;
      console.log(output);
    } else if (step.command && step.args) {
      const res = await runCommand(step.command, step.args);
      success = res.success;
      output = res.output;
    }

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
    const num = `[${r.stepNumber}/${AUDIT_STEPS.length}]`;
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
