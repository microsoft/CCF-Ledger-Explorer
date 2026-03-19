/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the Apache License, Version 2.0.
 */

import { useContext, createContext } from 'react';
import { TelemetryEvents } from './telemetry-service';

export interface TelemetryContextValue {
  trackPageView: (name: string, uri?: string) => void;
  trackEvent: (name: string, properties?: Record<string, string | number | boolean>) => void;
  trackException: (error: Error, properties?: Record<string, string>) => void;
  isTelemetryEnabled: () => boolean;
  setTelemetryEnabled: (enabled: boolean) => void;
  TelemetryEvents: typeof TelemetryEvents;
}

export const TelemetryContext = createContext<TelemetryContextValue | null>(null);

/**
 * Hook to access telemetry functions from components.
 * 
 * @example
 * const { trackEvent, TelemetryEvents } = useTelemetry();
 * trackEvent(TelemetryEvents.FILE_UPLOADED, { fileCount: 3 });
 */
export function useTelemetry(): TelemetryContextValue {
  const context = useContext(TelemetryContext);
  
  if (!context) {
    // Return no-op functions if used outside provider
    // This allows components to work even if telemetry isn't set up
    return {
      trackPageView: () => {},
      trackEvent: () => {},
      trackException: () => {},
      isTelemetryEnabled: () => false,
      setTelemetryEnabled: () => {},
      TelemetryEvents,
    };
  }
  
  return context;
}
