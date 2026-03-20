/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the Apache License, Version 2.0.
 */

/**
 * Parameters needed to generate CLI commands for connecting
 * a storage account to the CCF Ledger Explorer managed application.
 */
export interface StorageConnectionParams {
  /** Azure subscription ID */
  subscriptionId: string;
  /** Resource group of the storage account */
  storageResourceGroup: string;
  /** Name of the storage account to connect */
  storageAccountName: string;
  /** Azure region (e.g., eastus, westus2) */
  location: string;
  /** Name for the Event Grid system topic */
  topicName: string;
  /** Name for the event subscription */
  subscriptionName: string;
  /** Managed resource group created by the managed application */
  managedResourceGroup: string;
  /** Service Bus namespace in the managed resource group */
  serviceBusNamespace: string;
  /** Service Bus queue name in the managed resource group */
  serviceBusQueueName: string;
  /** Object ID of the Azure Function's managed identity */
  functionIdentityOid: string;
  /** Session ID for delivery attribute mapping (auto-generated UUID) */
  sessionId: string;
  /** Whether to include Delete Blob events in the subscription */
  includeDeleteEvents: boolean;
}

/**
 * A generated CLI script with metadata.
 */
export interface GeneratedScript {
  /** Human-readable label for the script step */
  label: string;
  /** Description of what this step does */
  description: string;
  /** The CLI command(s) */
  command: string;
}
