/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the Apache License, Version 2.0.
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testfilepath = path.dirname(fileURLToPath(import.meta.url));

test('main page has title', async ({ page }) => {
  await page.goto('/');
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Explorer/);
});

test('files page button opens add files dialog', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Files' }).click();
  await page.getByRole('button', { name: 'Add Files' }).click();
  await page.getByRole('button', { name: 'Browse Files' }).click();
  await expect(page.getByRole('heading', { name: 'Add Ledger Files' })).toBeVisible();
});

test('cannot upload invalid file names', async ({ page }) => {
  await page.goto('/files');
  await page.getByRole('button', { name: 'Add Files' }).click();
  await page.getByRole('button', { name: 'Browse Files' }).click();
  await page.getByLabel('Upload CCF ledger files').setInputFiles([
    path.join(testfilepath, 'test_files', 'invalidnameledger_1-14.committed'),
  ]);
  await expect(page.getByRole('group', { name: 'Invalid File Sequence' })).toBeVisible();
});

test('successfully imports ledger files', async ({ page }) => {
  await page.goto('/files');
  await page.getByRole('button', { name: 'Add Files' }).click();
  await page.getByRole('button', { name: 'Browse Files' }).click();
  await page.getByLabel('Upload CCF ledger files').setInputFiles([
    path.join(testfilepath, 'test_files', 'ledger_1-14.committed'),
    path.join(testfilepath, 'test_files', 'ledger_15-3926.committed'),
  ]);
  await expect(page.getByText('Total: 14 transactions')).toBeVisible();
});

test('transactions pagination works and resets on type filter', async ({ page }) => {
  await page.goto('/files');

  // Import sample files (should yield > 10 transactions)
  await page.getByRole('button', { name: 'Add Files' }).click();
  await page.getByRole('button', { name: 'Browse Files' }).click();
  await page.getByLabel('Upload CCF ledger files').setInputFiles([
    path.join(testfilepath, 'test_files', 'ledger_1-14.committed'),
    path.join(testfilepath, 'test_files', 'ledger_15-3926.committed'),
  ]);

  // Pagination should be visible since pageSize is 10
  await expect(page.getByText(/Page\s+1\s+of\s+\d+/)).toBeVisible();

  // Go to next page
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText(/Page\s+2\s+of\s+\d+/)).toBeVisible();

  // Toggle a type filter in the ledger visualization; should reset back to page 1
  // Pick a commonly present type in fixtures.
  await page.getByRole('button', { name: /Signature\s*\(\d+\)/ }).click();
  await expect(page.getByText(/Page\s+1\s+of\s+\d+/)).toBeVisible();
});