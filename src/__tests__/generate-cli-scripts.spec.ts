/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the Apache License, Version 2.0.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateCliScripts,
  generateFullScript,
} from '../services/storage-connection/generate-cli-scripts';
import type { StorageConnectionParams } from '../types/storage-connection-types';

const validParams: StorageConnectionParams = {
  subscriptionId: '00000000-0000-0000-0000-000000000001',
  storageResourceGroup: 'my-rg',
  storageAccountName: 'mystorageacct',
  location: 'eastus',
  topicName: 'mystorageacct-topic',
  subscriptionName: 'mystorageacct-sub',
  managedResourceGroup: 'mrg-myapp',
  serviceBusNamespace: 'sb-myapp',
  serviceBusQueueName: 'digest-queue',
  functionIdentityOid: '00000000-0000-0000-0000-000000000002',
  sessionId: 'test-session-id',
  includeDeleteEvents: false,
};

describe('generateCliScripts', () => {
  it('should generate exactly 4 steps', () => {
    const scripts = generateCliScripts(validParams);
    expect(scripts).toHaveLength(4);
  });

  it('should include the storage account name in step 1', () => {
    const scripts = generateCliScripts(validParams);
    expect(scripts[0].command).toContain('mystorageacct');
    expect(scripts[0].command).toContain('system-topic create');
  });

  it('should include service bus data sender role in step 2', () => {
    const scripts = generateCliScripts(validParams);
    expect(scripts[1].command).toContain('Azure Service Bus Data Sender');
  });

  it('should include only BlobCreated when includeDeleteEvents is false', () => {
    const scripts = generateCliScripts(validParams);
    expect(scripts[2].command).toContain('Microsoft.Storage.BlobCreated');
    expect(scripts[2].command).not.toContain('Microsoft.Storage.BlobDeleted');
  });

  it('should include BlobDeleted when includeDeleteEvents is true', () => {
    const scripts = generateCliScripts({
      ...validParams,
      includeDeleteEvents: true,
    });
    expect(scripts[2].command).toContain('Microsoft.Storage.BlobCreated');
    expect(scripts[2].command).toContain('Microsoft.Storage.BlobDeleted');
  });

  it('should include the session ID in step 3', () => {
    const scripts = generateCliScripts(validParams);
    expect(scripts[2].command).toContain('test-session-id');
  });

  it('should include the function OID in step 4', () => {
    const scripts = generateCliScripts(validParams);
    expect(scripts[3].command).toContain('00000000-0000-0000-0000-000000000002');
    expect(scripts[3].command).toContain('Storage Blob Data Owner');
  });

  it('should construct correct storage account resource ID', () => {
    const scripts = generateCliScripts(validParams);
    const expectedStorageId =
      '/subscriptions/00000000-0000-0000-0000-000000000001/resourceGroups/my-rg/providers/Microsoft.Storage/storageAccounts/mystorageacct';
    expect(scripts[0].command).toContain(expectedStorageId);
  });

  it('should construct correct service bus queue resource ID', () => {
    const scripts = generateCliScripts(validParams);
    const expectedQueueId =
      '/subscriptions/00000000-0000-0000-0000-000000000001/resourceGroups/mrg-myapp/providers/Microsoft.ServiceBus/namespaces/sb-myapp/queues/digest-queue';
    expect(scripts[1].command).toContain(expectedQueueId);
  });

  it('should use delivery-identity for authenticated delivery in step 3', () => {
    const scripts = generateCliScripts(validParams);
    expect(scripts[2].command).toContain('delivery-identity-endpoint-type servicebusqueue');
    expect(scripts[2].command).toContain('delivery-identity systemassigned');
  });

  it('should use correct location in step 1', () => {
    const scripts = generateCliScripts(validParams);
    expect(scripts[0].command).toContain('--location "eastus"');
  });

  it('should include all labels', () => {
    const scripts = generateCliScripts(validParams);
    expect(scripts[0].label).toContain('Create Event Grid System Topic');
    expect(scripts[1].label).toContain('Assign Service Bus Data Sender');
    expect(scripts[2].label).toContain('Create Event Subscription');
    expect(scripts[3].label).toContain('Assign Storage Blob Data Owner');
  });

  it('should have descriptions for all steps', () => {
    const scripts = generateCliScripts(validParams);
    scripts.forEach((script) => {
      expect(script.description.length).toBeGreaterThan(20);
    });
  });
});

describe('generateFullScript', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20T12:00:00.000Z'));
  });

  it('should include bash shebang', () => {
    const script = generateFullScript(validParams);
    expect(script).toMatch(/^#!\/bin\/bash/);
  });

  it('should include set -euo pipefail', () => {
    const script = generateFullScript(validParams);
    expect(script).toContain('set -euo pipefail');
  });

  it('should include all 4 steps', () => {
    const script = generateFullScript(validParams);
    expect(script).toContain('system-topic create');
    expect(script).toContain('Azure Service Bus Data Sender');
    expect(script).toContain('event-subscription create');
    expect(script).toContain('Storage Blob Data Owner');
  });

  it('should include the storage account name in the header', () => {
    const script = generateFullScript(validParams);
    expect(script).toContain('Storage Account: mystorageacct');
  });

  it('should include the subscription ID in the header', () => {
    const script = generateFullScript(validParams);
    expect(script).toContain('Subscription:    00000000-0000-0000-0000-000000000001');
  });

  it('should include success message at the end', () => {
    const script = generateFullScript(validParams);
    expect(script).toContain('Done. Storage account connected successfully.');
  });

  it('should include prerequisites in header', () => {
    const script = generateFullScript(validParams);
    expect(script).toContain('Azure CLI installed and authenticated');
    expect(script).toContain('Owner or Contributor + User Access Administrator');
  });

  vi.useRealTimers();
});
