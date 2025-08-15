import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Field,
  Textarea,
  Card,
  CardHeader,
  Text,
  Body1,
  makeStyles,
  tokens,
  shorthands,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
} from '@fluentui/react-components';
import {
  Settings24Regular,
  Delete24Regular,
  DatabaseArrowDownRegular,
  DocumentAdd24Regular,
} from '@fluentui/react-icons';
import defaultSystemPrompt from '../assets/defaultSystemPrompt.md?raw';
import { 
  useAllTransactionsCount,
  useStats, 
  useClearAllData,
  useDropDatabase,
} from '../hooks/use-ccf-data';
import { AddFilesWizard } from '../components/AddFilesWizard';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    color: tokens.colorPaletteRedForeground1,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  configHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  configContent: {
    ...shorthands.padding('16px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
});

interface ChatConfig {
  baseUrl: string;
  systemPrompt: string;
}

// Custom hook for managing configuration state
export const useConfig = () => {
  const [config, setConfig] = useState<ChatConfig>({
    baseUrl: localStorage.getItem('chat_base_url') || '',
    systemPrompt: localStorage.getItem('chat_system_prompt') || defaultSystemPrompt,
  });

  useEffect(() => {
    localStorage.setItem('chat_base_url', config.baseUrl);
    if (config.systemPrompt) {
      localStorage.setItem('chat_system_prompt', config.systemPrompt);
    } else {
      localStorage.setItem('chat_system_prompt', defaultSystemPrompt);
    }
  }, [config]);

  return { config, setConfig };
};

export const ConfigPage: React.FC = () => {
  const styles = useStyles();
  const { config, setConfig } = useConfig();
  const { data: allTransactionsCount } = useAllTransactionsCount();
  const [showUploadDialog, setShowUploadDialog] = React.useState(false);
  const { data: stats } = useStats();
  const clearAllDataMutation = useClearAllData();
  const dropDatabaseMutation = useDropDatabase();

  const hasData = stats && (stats.fileCount > 0 || stats.transactionCount > 0);

  const handleClearAllData = async () => {
    try {
      await clearAllDataMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  };

  const handleDropDatabase = async () => {
    try {
      await dropDatabaseMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to drop database:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card>
          <CardHeader
            header={
              <div className={styles.configHeader}>
                <Settings24Regular />
                <Text weight="semibold">Ledger data configuration</Text>
              </div>
            }
          />
          <div className={styles.configContent}>
            <Text size={200}>
              Ledger data gets imported and then is exposed in various pages. It can also be queried.
            </Text>

            { allTransactionsCount && allTransactionsCount > 0 ? <Text size={200}>Imported transactions: {allTransactionsCount}</Text> : <Text size={200}>No imported data found</Text> }
            
            <div>
              {/* Upload Files Button */}
              <Button
                appearance="outline"
                icon={<DocumentAdd24Regular />}
                onClick={() => setShowUploadDialog(true)}
              >
                Add Files
              </Button>

              <AddFilesWizard 
                open={showUploadDialog} 
                onOpenChange={setShowUploadDialog}
              />

              {/* Clear All Data Button */}
              { hasData && <Dialog>
                <DialogTrigger disableButtonEnhancement>
                  <Button
                    appearance="outline"
                    icon={<Delete24Regular />}
                    disabled={clearAllDataMutation.isPending}
                  >
                    Clear All Data
                  </Button>
                </DialogTrigger>
                <DialogSurface>
                  <DialogTitle>Clear All Data</DialogTitle>
                  <DialogContent>
                    <DialogBody>
                      <Body1>
                        Are you sure you want to clear all data? This will permanently delete:
                      </Body1>
                      <ul>
                        <li>{stats.fileCount} ledger file{stats.fileCount !== 1 ? 's' : ''}</li>
                        <li>{stats.transactionCount} transaction{stats.transactionCount !== 1 ? 's' : ''}</li>
                        <li>{stats.writeCount} write operation{stats.writeCount !== 1 ? 's' : ''}</li>
                        <li>{stats.deleteCount} delete operation{stats.deleteCount !== 1 ? 's' : ''}</li>
                      </ul>
                      <Body1>This action cannot be undone.</Body1>
                    </DialogBody>
                    <DialogActions>
                      <DialogTrigger disableButtonEnhancement>
                        <Button appearance="secondary">Cancel</Button>
                      </DialogTrigger>
                      <Button
                        appearance="primary"
                        onClick={handleClearAllData}
                        disabled={clearAllDataMutation.isPending}
                      >
                        {clearAllDataMutation.isPending ? 'Clearing...' : 'Clear All Data'}
                      </Button>
                    </DialogActions>
                  </DialogContent>
                </DialogSurface>
              </Dialog>
              }

              {/* Drop Database Button */}
              <Dialog>
                <DialogTrigger disableButtonEnhancement>
                  <Button
                    appearance="outline"
                    icon={<DatabaseArrowDownRegular />}
                    disabled={dropDatabaseMutation.isPending}
                  >
                    Drop DB
                  </Button>
                </DialogTrigger>
                <DialogSurface>
                  <DialogTitle>Drop Database</DialogTitle>
                  <DialogContent>
                    <DialogBody>
                      <Body1>
                        Are you sure you want to drop the entire database? This will:
                      </Body1>
                      <ul>
                        <li>Remove all tables and data completely</li>
                        <li>Reset the database schema to its initial state</li>
                        <li>Free up all storage space used by the database</li>
                      </ul>
                      <Body1>
                        This is more thorough than "Clear All Data" and will completely reset the database structure.
                        This action cannot be undone.
                      </Body1>
                    </DialogBody>
                    <DialogActions>
                      <DialogTrigger disableButtonEnhancement>
                        <Button appearance="secondary">Cancel</Button>
                      </DialogTrigger>
                      <Button
                        appearance="primary"
                        onClick={handleDropDatabase}
                        disabled={dropDatabaseMutation.isPending}
                      >
                        {dropDatabaseMutation.isPending ? 'Dropping...' : 'Drop Database'}
                      </Button>
                    </DialogActions>
                  </DialogContent>
                </DialogSurface>
              </Dialog>
            </div>
          </div>
        </Card>


        <Card>
          <CardHeader
            header={
              <div className={styles.configHeader}>
                <Settings24Regular />
                <Text weight="semibold">Agent configuration</Text>
              </div>
            }
          />
          <div className={styles.configContent}>
            <Text size={200}>
              Configuration for the AI chat assistant. Set the base URL for the OpenAI API and the system prompt.
            </Text>

            <Field label="Base URL">
              <Input
                type="url"
                placeholder="https://xyz.cognitiveservices.azure.com/"
                value={config.baseUrl}
                onChange={(_, data) => setConfig(prev => ({ ...prev, baseUrl: data.value }))} />
            </Field>

            <Field label="System prompt">
              <Textarea
                resize='vertical'
                placeholder="Enter system prompt"
                rows={10}
                value={config.systemPrompt}
                onChange={(_, data) => setConfig(prev => ({ ...prev, systemPrompt: data.value }))} />
            </Field>
          </div>
        </Card>
      </div>
    </div>
  );
};

