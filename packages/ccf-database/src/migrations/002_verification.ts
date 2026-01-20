/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the Apache License, Version 2.0.
 */

import type { Migration } from '../types/migration-types';

/**
 * Migration to add verification tracking to ledger_files.
 * 
 * Adds:
 * - verified: BOOLEAN indicating if the chunk has been verified
 * - verified_at: DATETIME when verification was performed
 * - verification_error: TEXT for storing verification error messages
 */
export const migration: Migration = {
  version: 2,
  name: 'add_verification_columns',
  statements: [
    // Add verified column (default to NULL for unknown/not verified)
    `ALTER TABLE ledger_files ADD COLUMN verified INTEGER DEFAULT NULL`,
    
    // Add verified_at timestamp
    `ALTER TABLE ledger_files ADD COLUMN verified_at DATETIME DEFAULT NULL`,
    
    // Add verification error message
    `ALTER TABLE ledger_files ADD COLUMN verification_error TEXT DEFAULT NULL`,
  ],
};
