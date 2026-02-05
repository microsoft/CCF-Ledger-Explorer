/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the Apache License, Version 2.0.
 */

import { useQuery } from '@tanstack/react-query';

interface HealthResponse {
  status?: string;
  configured?: boolean;
}

export const useApiHealth = (baseUrl: string) => {
  return useQuery<HealthResponse>({
    queryKey: ['health', baseUrl],
    queryFn: async () => {
      if (!baseUrl) {
        return { status: 'unknown', configured: false };
      }

      const response = await fetch(baseUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch health: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!baseUrl,
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });
};
