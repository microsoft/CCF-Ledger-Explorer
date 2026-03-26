/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the Apache License, Version 2.0.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  Button,
  TabList,
  Tab,
  tokens,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  WeatherMoon24Regular,
  WeatherSunny24Regular,
  FolderRegular,
  DatabaseRegular,
  NumberSymbolRegular,
  Bot24Regular,
  ShieldCheckmarkRegular,
  DocumentSearch24Regular,
  Settings24Regular,
  Wrench24Regular,
  ChevronDown20Regular,
} from '@fluentui/react-icons';
import { 
  useStats,
} from '../hooks/use-ccf-data';
import { useConfig } from '../pages/ConfigPage';
import { useOpenAIKeyValidation } from '../hooks/use-openai-key-validation';
import ccfLogo from '../assets/ccf.svg';

const useStyles = makeStyles({
  header: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2BrandHover,
    padding: '8px 24px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Reduce z-index to prevent potential layering conflicts
    zIndex: 10,
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  navigation: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  toolsButton: {
    minWidth: 'auto',
  },
});

interface MenuBarProps {
  onToggleTheme: () => void;
  isDarkMode: boolean;
}

export const MenuBar: React.FC<MenuBarProps> = ({ 
  onToggleTheme, 
  isDarkMode, 
}) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { data: stats } = useStats();
  const { config } = useConfig();
  const { data: keyValidation } = useOpenAIKeyValidation(config.openaiApiKey);

  const hasData = stats && (stats.fileCount > 0 || stats.transactionCount > 0);
  
  // For SAGE builds: always show chat tab
  // For non-SAGE builds: only show if chat is enabled and API key is valid
  const isSageBuild = import.meta.env.VITE_ENABLE_SAGE === 'true';
  const showChatTab = isSageBuild || 
                      (config.chatEnabled && 
                       config.openaiApiKey && 
                       keyValidation?.valid);

  const handleTabChange = (tabValue: string) => {
    if (tabValue === 'files') {
      navigate('/files');
    } else if (tabValue === 'tables') {
      navigate('/tables');
    } else if (tabValue === 'stats') {
      navigate('/stats');
    } else if (tabValue === 'chat') {
      navigate('/chat');
    } else if (tabValue === 'config') {
      navigate('/config');
    }
  };

  // TODO: Refactor to use dictionary mapping if more tools are added
  const handleToolsMenuSelect = (toolValue: string) => {
    if (toolValue === 'ledger-verification') {
      navigate('/verification');
    } else if (toolValue === 'acl-receipt-verification') {
      navigate('/write-receipt');
    } else if (toolValue === 'mst-receipt-verification') {
      navigate('/mst-receipt');
    } else if (toolValue === 'cose-viewer') {
      navigate('/cose-viewer');
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <a className={styles.logo} href="/" title='Ledger Explorer'>
          <img height={30} src={ccfLogo} alt="CCF Logo" />
        </a>
        <span className={styles.title}>Ledger Explorer</span>
      </div>

      {/* Navigation and Header Actions */}
      <div className={styles.navigation}>
        {/* Navigation Tabs */}
          <TabList onTabSelect={(_, data) => handleTabChange(data.value as string)} >
            {showChatTab && (
              <Tab value="chat" icon={<Bot24Regular />}>
                Chat
              </Tab>
            )}
            <Tab value="files" icon={<FolderRegular />}>
              Files
            </Tab>
            { hasData && (<>
              <Tab value="tables" icon={<DatabaseRegular />}>
                Tables
              </Tab>
              <Tab value="stats" icon={<NumberSymbolRegular />}>
                Stats
              </Tab>
            </>)}
            <Tab value="config" icon={<Settings24Regular />}>
              Configuration
            </Tab>
          </TabList>

        {/* Tools Dropdown Menu */}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button 
              appearance="subtle" 
              icon={<Wrench24Regular />}
              iconPosition="before"
              className={styles.toolsButton}
              aria-label="Tools menu"
            >
              Tools
              <ChevronDown20Regular />
            </Button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              { hasData && (
                <>
                  <MenuItem 
                    icon={<ShieldCheckmarkRegular />}
                    onClick={() => handleToolsMenuSelect('ledger-verification')}
                  >
                    Ledger Verification
                  </MenuItem>
                </>
              )}
              <MenuItem 
                icon={<DocumentSearch24Regular />}
                onClick={() => handleToolsMenuSelect('acl-receipt-verification')}
              >
                ACL Receipt Verification
              </MenuItem>
              <MenuItem 
                icon={<DocumentSearch24Regular />}
                onClick={() => handleToolsMenuSelect('mst-receipt-verification')}
              >
                MST Receipt Verification
              </MenuItem>
              <MenuItem 
                icon={<DocumentSearch24Regular />}
                onClick={() => handleToolsMenuSelect('cose-viewer')}
              >
                COSE/CBOR Viewer
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        {/* Header Actions */}
        <div className={styles.headerActions}>
          {/* GitHub Repository Link */}
          <Button
            appearance="subtle"
            icon={
              <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            }
            as="a"
            href="https://github.com/microsoft/CCF-Ledger-Explorer"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on GitHub"
          />
          {/* Theme Toggle Button */}
          <Button
            appearance="subtle"
            icon={isDarkMode ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
            onClick={onToggleTheme}
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          />
        </div>
      </div>
    </header>
  );
};
