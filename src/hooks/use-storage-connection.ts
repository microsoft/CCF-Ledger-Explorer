/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the Apache License, Version 2.0.
 */

import { useState, useCallback, useMemo } from 'react';
import type { StorageConnectionParams, GeneratedScript } from '../types/storage-connection-types';
import { generateCliScripts, generateFullScript } from '../services/storage-connection/generate-cli-scripts';

/**
 * Hook that manages the state for the storage connection form
 * and generates CLI scripts from the collected parameters.
 */
export function useStorageConnection() {
  const [params, setParams] = useState<StorageConnectionParams>({
    subscriptionId: '',
    storageResourceGroup: '',
    storageAccountName: '',
    location: '',
    topicName: '',
    subscriptionName: '',
    managedResourceGroup: '',
    serviceBusNamespace: '',
    serviceBusQueueName: '',
    functionIdentityOid: '',
    sessionId: crypto.randomUUID(),
    includeDeleteEvents: false,
  });

  const [generated, setGenerated] = useState(false);

  const updateParam = useCallback(
    <K extends keyof StorageConnectionParams>(key: K, value: StorageConnectionParams[K]) => {
      setParams((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateStorageAccountName = useCallback((name: string) => {
    setParams((prev) => ({
      ...prev,
      storageAccountName: name,
      topicName: prev.topicName || `${name}-topic`,
      subscriptionName: prev.subscriptionName || `${name}-sub`,
    }));
  }, []);

  const regenerateSessionId = useCallback(() => {
    setParams((prev) => ({ ...prev, sessionId: crypto.randomUUID() }));
  }, []);

  const isValid = useMemo(() => {
    const required: (keyof StorageConnectionParams)[] = [
      'subscriptionId',
      'storageResourceGroup',
      'storageAccountName',
      'location',
      'topicName',
      'subscriptionName',
      'managedResourceGroup',
      'serviceBusNamespace',
      'serviceBusQueueName',
      'functionIdentityOid',
      'sessionId',
    ];
    return required.every((key) => {
      const val = params[key];
      return typeof val === 'string' ? val.trim().length > 0 : true;
    });
  }, [params]);

  const scripts: GeneratedScript[] = useMemo(() => {
    if (!isValid) return [];
    return generateCliScripts(params);
  }, [params, isValid]);

  const fullScript: string = useMemo(() => {
    if (!isValid) return '';
    return generateFullScript(params);
  }, [params, isValid]);

  const generate = useCallback(() => {
    if (isValid) setGenerated(true);
  }, [isValid]);

  const reset = useCallback(() => {
    setGenerated(false);
  }, []);

  return {
    params,
    updateParam,
    updateStorageAccountName,
    regenerateSessionId,
    isValid,
    generated,
    generate,
    reset,
    scripts,
    fullScript,
  };
}
