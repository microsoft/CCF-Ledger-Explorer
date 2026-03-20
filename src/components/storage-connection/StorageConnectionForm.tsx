/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the Apache License, Version 2.0.
 */

import {
  makeStyles,
  tokens,
  Field,
  Input,
  Button,
  Switch,
  Tooltip,
  Divider,
  Text,
  Card,
  CardHeader,
  Badge,
} from '@fluentui/react-components';
import {
  ArrowSyncRegular,
  InfoRegular,
} from '@fluentui/react-icons';
import type { StorageConnectionParams } from '../../types/storage-connection-types';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    maxWidth: '720px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
  sessionRow: {
    display: 'flex',
    alignItems: 'end',
    gap: tokens.spacingHorizontalS,
  },
  sessionInput: {
    flex: 1,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
});

interface StorageConnectionFormProps {
  params: StorageConnectionParams;
  isValid: boolean;
  onUpdateParam: <K extends keyof StorageConnectionParams>(
    key: K,
    value: StorageConnectionParams[K],
  ) => void;
  onUpdateStorageAccountName: (name: string) => void;
  onRegenerateSessionId: () => void;
  onGenerate: () => void;
}

export function StorageConnectionForm({
  params,
  isValid,
  onUpdateParam,
  onUpdateStorageAccountName,
  onRegenerateSessionId,
  onGenerate,
}: StorageConnectionFormProps) {
  const styles = useStyles();

  return (
    <div className={styles.form}>
      {/* Storage Account Section */}
      <Card>
        <CardHeader
          header={
            <div className={styles.sectionHeader}>
              <Text weight="semibold" size={400}>Storage Account</Text>
              <Badge appearance="outline" color="informative">Required</Badge>
            </div>
          }
          description="The storage account you want to connect for blob digest tracking."
        />
        <div className={styles.section}>
          <Field label="Subscription ID" required>
            <Input
              value={params.subscriptionId}
              onChange={(_, data) => onUpdateParam('subscriptionId', data.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </Field>
          <div className={styles.row}>
            <Field label="Storage Account Name" required>
              <Input
                value={params.storageAccountName}
                onChange={(_, data) => onUpdateStorageAccountName(data.value)}
                placeholder="mystorageaccount"
              />
            </Field>
            <Field label="Resource Group" required>
              <Input
                value={params.storageResourceGroup}
                onChange={(_, data) => onUpdateParam('storageResourceGroup', data.value)}
                placeholder="my-resource-group"
              />
            </Field>
          </div>
          <Field label="Location" required>
            <Input
              value={params.location}
              onChange={(_, data) => onUpdateParam('location', data.value)}
              placeholder="eastus"
            />
          </Field>
        </div>
      </Card>

      {/* Managed Application Section */}
      <Card>
        <CardHeader
          header={
            <div className={styles.sectionHeader}>
              <Text weight="semibold" size={400}>Managed Application</Text>
              <Badge appearance="outline" color="informative">Required</Badge>
            </div>
          }
          description="Details from the deployed managed application's resource group."
        />
        <div className={styles.section}>
          <Field label="Managed Resource Group" required>
            <Input
              value={params.managedResourceGroup}
              onChange={(_, data) => onUpdateParam('managedResourceGroup', data.value)}
              placeholder="mrg-myapp-xxxxxxxx"
            />
          </Field>
          <div className={styles.row}>
            <Field label="Service Bus Namespace" required>
              <Input
                value={params.serviceBusNamespace}
                onChange={(_, data) => onUpdateParam('serviceBusNamespace', data.value)}
                placeholder="sb-myapp-namespace"
              />
            </Field>
            <Field label="Service Bus Queue" required>
              <Input
                value={params.serviceBusQueueName}
                onChange={(_, data) => onUpdateParam('serviceBusQueueName', data.value)}
                placeholder="digest-queue"
              />
            </Field>
          </div>
          <Field
            label="Function Identity Object ID"
            required
            hint="Found on the Azure Function's Identity pane in the Azure Portal."
          >
            <Input
              value={params.functionIdentityOid}
              onChange={(_, data) => onUpdateParam('functionIdentityOid', data.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </Field>
        </div>
      </Card>

      {/* Event Grid Section */}
      <Card>
        <CardHeader
          header={
            <div className={styles.sectionHeader}>
              <Text weight="semibold" size={400}>Event Grid Configuration</Text>
              <Badge appearance="outline" color="subtle">Auto-populated</Badge>
            </div>
          }
          description="Names for the Event Grid topic, subscription, and session ID."
        />
        <div className={styles.section}>
          <div className={styles.row}>
            <Field label="System Topic Name" required>
              <Input
                value={params.topicName}
                onChange={(_, data) => onUpdateParam('topicName', data.value)}
                placeholder="mystorageaccount-topic"
              />
            </Field>
            <Field label="Event Subscription Name" required>
              <Input
                value={params.subscriptionName}
                onChange={(_, data) => onUpdateParam('subscriptionName', data.value)}
                placeholder="mystorageaccount-sub"
              />
            </Field>
          </div>
          <Field label="Session ID" required>
            <div className={styles.sessionRow}>
              <div className={styles.sessionInput}>
                <Input
                  value={params.sessionId}
                  onChange={(_, data) => onUpdateParam('sessionId', data.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <Tooltip content="Generate a new random session ID" relationship="label">
                <Button
                  icon={<ArrowSyncRegular />}
                  onClick={onRegenerateSessionId}
                  appearance="subtle"
                  aria-label="Regenerate session ID"
                />
              </Tooltip>
            </div>
          </Field>
          <Field label="">
            <Switch
              checked={params.includeDeleteEvents}
              onChange={(_, data) => onUpdateParam('includeDeleteEvents', data.checked)}
              label="Include Delete Blob events"
            />
          </Field>
        </div>
      </Card>

      <Divider />

      {/* Info callout */}
      <div className={styles.sectionHeader}>
        <InfoRegular />
        <Text size={200}>
          No credentials are stored. The generated commands run in your terminal using your own{' '}
          <code>az login</code> session.
        </Text>
      </div>

      <div className={styles.actions}>
        <Button
          appearance="primary"
          disabled={!isValid}
          onClick={onGenerate}
        >
          Generate CLI Commands
        </Button>
      </div>
    </div>
  );
}
