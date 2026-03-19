/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the Apache License, Version 2.0.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isTelemetryEnabled,
  setTelemetryEnabled,
  initializeTelemetry,
  trackPageView,
  trackEvent,
  trackException,
  TelemetryEvents,
} from '../services/telemetry/telemetry-service';

// Mock the Application Insights modules
vi.mock('@microsoft/applicationinsights-web', () => ({
  ApplicationInsights: vi.fn().mockImplementation(() => ({
    loadAppInsights: vi.fn(),
    trackPageView: vi.fn(),
    trackEvent: vi.fn(),
    trackException: vi.fn(),
    config: {
      disableTelemetry: false,
    },
  })),
}));

vi.mock('@microsoft/applicationinsights-react-js', () => ({
  ReactPlugin: vi.fn().mockImplementation(() => ({})),
}));

describe('telemetry-service', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset module state between tests by clearing the import cache
    vi.resetModules();
  });

  describe('isTelemetryEnabled', () => {
    it('returns true by default (opt-out model)', () => {
      expect(isTelemetryEnabled()).toBe(true);
    });

    it('returns false when explicitly disabled', () => {
      localStorage.setItem('ccf-telemetry-enabled', 'false');
      expect(isTelemetryEnabled()).toBe(false);
    });

    it('returns true when explicitly enabled', () => {
      localStorage.setItem('ccf-telemetry-enabled', 'true');
      expect(isTelemetryEnabled()).toBe(true);
    });
  });

  describe('setTelemetryEnabled', () => {
    it('stores preference in localStorage', () => {
      setTelemetryEnabled(false);
      expect(localStorage.getItem('ccf-telemetry-enabled')).toBe('false');

      setTelemetryEnabled(true);
      expect(localStorage.getItem('ccf-telemetry-enabled')).toBe('true');
    });
  });

  describe('initializeTelemetry', () => {
    it('returns false when user has opted out', () => {
      localStorage.setItem('ccf-telemetry-enabled', 'false');
      const result = initializeTelemetry();
      expect(result).toBe(false);
    });

    it('returns false when connection string is not configured', () => {
      // No VITE_APPINSIGHTS_CONNECTION_STRING set
      const result = initializeTelemetry();
      expect(result).toBe(false);
    });
  });

  describe('trackPageView', () => {
    it('does not throw when called before initialization', () => {
      expect(() => trackPageView('TestPage')).not.toThrow();
    });

    it('does not throw when telemetry is disabled', () => {
      localStorage.setItem('ccf-telemetry-enabled', 'false');
      expect(() => trackPageView('TestPage')).not.toThrow();
    });
  });

  describe('trackEvent', () => {
    it('does not throw when called before initialization', () => {
      expect(() => trackEvent('TestEvent')).not.toThrow();
    });

    it('does not throw when called with properties', () => {
      expect(() => trackEvent('TestEvent', { count: 5, enabled: true })).not.toThrow();
    });

    it('does not throw when telemetry is disabled', () => {
      localStorage.setItem('ccf-telemetry-enabled', 'false');
      expect(() => trackEvent('TestEvent')).not.toThrow();
    });
  });

  describe('trackException', () => {
    it('does not throw when called before initialization', () => {
      const error = new Error('Test error');
      expect(() => trackException(error)).not.toThrow();
    });

    it('does not throw when called with properties', () => {
      const error = new Error('Test error');
      expect(() => trackException(error, { context: 'test' })).not.toThrow();
    });
  });

  describe('TelemetryEvents', () => {
    it('exports expected event names', () => {
      expect(TelemetryEvents.FILE_UPLOADED).toBe('FileUploaded');
      expect(TelemetryEvents.FILE_DELETED).toBe('FileDeleted');
      expect(TelemetryEvents.SQL_QUERY_EXECUTED).toBe('SqlQueryExecuted');
      expect(TelemetryEvents.VERIFICATION_STARTED).toBe('VerificationStarted');
      expect(TelemetryEvents.VERIFICATION_COMPLETED).toBe('VerificationCompleted');
      expect(TelemetryEvents.CHAT_MESSAGE_SENT).toBe('ChatMessageSent');
      expect(TelemetryEvents.TELEMETRY_TOGGLED).toBe('TelemetryToggled');
    });
  });
});
