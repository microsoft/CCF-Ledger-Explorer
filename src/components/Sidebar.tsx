/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the Apache License, Version 2.0.
 */

import React from 'react';
import { makeStyles, tokens, Button, Text } from '@fluentui/react-components';
import { ChevronLeftRegular, ChevronRightRegular } from '@fluentui/react-icons';
import { SIDEBAR_WIDTH } from './sidebar-constants';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    transition: 'width 0.2s ease',
    overflow: 'hidden',
  },
  expanded: {
    width: `${SIDEBAR_WIDTH.expanded}px`,
  },
  collapsed: {
    width: `${SIDEBAR_WIDTH.collapsed}px`,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: '48px',
    boxSizing: 'border-box',
  },
  headerCollapsed: {
    justifyContent: 'center',
    padding: '12px 8px',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    overflow: 'hidden',
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  collapseButton: {
    flexShrink: 0,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  contentPadded: {
    padding: '8px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginLeft: '8px',
    flexShrink: 0,
  },
});

export interface SidebarProps {
  /** The title displayed in the sidebar header */
  title: string;
  /** Optional icon to display before the title */
  icon?: React.ReactNode;
  /** Whether the sidebar is currently collapsed */
  isCollapsed?: boolean;
  /** Callback when the collapse toggle is clicked */
  onToggleCollapse?: () => void;
  /** Whether to show the collapse toggle button */
  collapsible?: boolean;
  /** Main content to render in the sidebar */
  children: React.ReactNode;
  /** Optional actions to show in the header (e.g., buttons) */
  headerActions?: React.ReactNode;
  /** Whether to add default padding to the content area */
  contentPadded?: boolean;
  /** Additional class name for the root element */
  className?: string;
}

/**
 * A unified sidebar component for consistent navigation/content panels across the app.
 * Supports collapsible behavior with smooth animations and consistent styling.
 * 
 * @example
 * ```tsx
 * <Sidebar
 *   title="Tables"
 *   icon={<DatabaseRegular />}
 *   isCollapsed={isCollapsed}
 *   onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
 *   collapsible
 * >
 *   <TablesList tables={tables} />
 * </Sidebar>
 * ```
 */
export const Sidebar: React.FC<SidebarProps> = ({
  title,
  icon,
  isCollapsed = false,
  onToggleCollapse,
  collapsible = true,
  children,
  headerActions,
  contentPadded = true,
  className,
}) => {
  const styles = useStyles();

  const rootClassName = [
    styles.root,
    isCollapsed ? styles.collapsed : styles.expanded,
    className,
  ].filter(Boolean).join(' ');

  const headerClassName = [
    styles.header,
    isCollapsed ? styles.headerCollapsed : '',
  ].filter(Boolean).join(' ');

  const contentClassName = [
    styles.content,
    contentPadded ? styles.contentPadded : '',
  ].filter(Boolean).join(' ');

  // Collapsed view: just show expand button
  if (isCollapsed) {
    return (
      <div className={rootClassName}>
        <div className={headerClassName}>
          {collapsible && onToggleCollapse && (
            <Button
              appearance="subtle"
              icon={<ChevronRightRegular />}
              onClick={onToggleCollapse}
              title={`Expand ${title}`}
              aria-label={`Expand ${title}`}
              className={styles.collapseButton}
            />
          )}
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className={rootClassName}>
      <div className={headerClassName}>
        <div className={styles.headerContent}>
          {icon}
          <Text className={styles.title}>{title}</Text>
        </div>
        {headerActions && (
          <div className={styles.headerActions}>
            {headerActions}
          </div>
        )}
        {collapsible && onToggleCollapse && (
          <Button
            appearance="subtle"
            icon={<ChevronLeftRegular />}
            onClick={onToggleCollapse}
            title={`Collapse ${title}`}
            aria-label={`Collapse ${title}`}
            className={styles.collapseButton}
          />
        )}
      </div>
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  );
};
