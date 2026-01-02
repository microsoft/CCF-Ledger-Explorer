/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the Apache License, Version 2.0.
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSharedStyles } from '../styles/design-system';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that applies a subtle entrance animation when the route changes.
 * Uses the centralized page transition settings from design-system.ts.
 * 
 * The animation is triggered by using the route pathname as a key, which causes
 * React to remount the wrapper and replay the CSS animation.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const styles = useSharedStyles();
  
  return (
    <div key={location.pathname} className={styles.pageTransitionWrapper}>
      {children}
    </div>
  );
};

export default PageTransition;
