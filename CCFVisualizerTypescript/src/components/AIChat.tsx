import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Textarea,
  Card,
  Spinner,
  Text,
  CompoundButton,
  MessageBar,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  Send24Regular,
  ChatAddRegular,
  Bot24Regular,
  Person24Regular,
} from '@fluentui/react-icons';
import { CCFDatabase } from '../database/ccf-database';
import { useAllTransactionsCount } from '../hooks/use-ccf-data';
import { useConfig } from '../pages/ConfigPage';
import { useVerification } from '../hooks/use-verification';
import type { WriteReceipt } from '../types/write-receipt-types';

// Direct IndexedDB check function
const checkIndexedDBForCheckpoints = async (): Promise<any[]> => {
  return new Promise((resolve) => {
    const request = indexedDB.open('CCFVerificationCheckpoints', 1);
    
    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      resolve([]);
    };
    
    request.onsuccess = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains('checkpoints')) {
        console.log('No checkpoints store found');
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(['checkpoints'], 'readonly');
      const store = transaction.objectStore('checkpoints');
      const getAllRequest = store.getAll();
      
      getAllRequest.onerror = () => {
        console.error('Failed to get checkpoints:', getAllRequest.error);
        resolve([]);
      };
      
      getAllRequest.onsuccess = () => {
        const checkpoints = getAllRequest.result;
        console.log('Direct IndexedDB check found checkpoints:', checkpoints);
        resolve(checkpoints);
      };
    };
  });
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  responseId?: string;
  content: string;
  sqlQuery?: string;
  sqlResult?: unknown[];
  timestamp: Date;
  error?: string;
  // New verification action fields
  verificationAction?: 'ledger' | 'receipt';
  verificationResult?: unknown;
  receiptData?: {
    receipt: WriteReceipt;
    networkCert: string;
  };
}

interface AIChatProps {
  database: CCFDatabase;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    height: '100%',
    minHeight: 0, // Critical for flex children to shrink
    flexDirection: 'row',
    justifyContent: 'space-around',
    ...shorthands.gap('16px'),
  },
  chatPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0, // Critical for flex child to shrink
    maxWidth: '800px',
    overflowY: 'auto',
    height: '100%', // Explicit height
  },
  chatCard: {
    flex: 1,
    display: 'grid',
    gridTemplateRows: 'auto 3fr auto', // Messages area takes remaining space, header and input area is auto-sized
    overflow: 'hidden', // Critical for proper layout
    minHeight: 0, // Allow flex child to shrink
    height: '100%', // Explicit height
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius('8px'),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  chatHeader: {
    position: 'relative',
    display: 'block',
    ...shorthands.gap('8px'),
  },
  messagesArea: {
    ...shorthands.padding('24px', '16px', '16px', '16px'),
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    minHeight: 0, // Critical for scrolling to work properly
    height: '100%', // Take full available height in grid row
    position: 'relative', // Ensure proper positioning context
  },
  messageContainer: {
    display: 'flex',
    ...shorthands.gap('12px'),
    alignItems: 'flex-start',
  },
  messageAvatar: {
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '16px',
    flexShrink: 0,
  },
  userAvatar: {
    backgroundColor: tokens.colorBrandBackground,
  },
  assistantAvatar: {
    backgroundColor: tokens.colorNeutralForeground3,
  },
  messageContent: {
    flex: 1,
    minWidth: 0,
  },
  messageBubble: {
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
  userBubble: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  assistantBubble: {
    backgroundColor: tokens.colorNeutralBackground1,
  },
  messageText: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  sqlSection: {
    ...shorthands.margin('12px', '0', '0', '0'),
  },
  sqlHeader: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorBrandForeground1,
  },
  sqlResultHeader: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorPaletteGreenForeground1,
  },
  sqlQuery: {
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.padding('8px'),
    ...shorthands.borderRadius('4px'),
    fontSize: '12px',
    ...shorthands.overflow('auto'),
    ...shorthands.margin('4px', '0'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
  },
  sqlResult: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    ...shorthands.padding('8px'),
    ...shorthands.borderRadius('4px'),
    fontSize: '12px',
    ...shorthands.overflow('auto'),
    ...shorthands.margin('4px', '0'),
    ...shorthands.border('1px', 'solid', tokens.colorPaletteGreenBorder1),
    fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
  },
  errorSection: {
    ...shorthands.margin('8px', '0', '0', '0'),
  },
  messageTimestamp: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    ...shorthands.margin('4px', '0', '0', '0'),
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    color: tokens.colorNeutralForeground3,
  },
  errorContainer: {
    ...shorthands.padding('8px', '16px', '0', '16px'),
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    zIndex: 10, // Ensure it appears above other content
  },
  inputArea: {
    display: 'flex',
    ...shorthands.gap('8px'),
    width: '100%',
    ...shorthands.padding('16px'),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  inputTextarea: {
    flex: 1,
    minHeight: '40px',
    maxHeight: '120px',
  },
  helpText: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
  },
});

export const AIChat: React.FC<AIChatProps> = ({ database }) => {
  const styles = useStyles();
  const { config } = useConfig();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const { data: allTransactionsCount } = useAllTransactionsCount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add verification hooks
  const verification = useVerification();
  
  // Force refresh checkpoints when component mounts
  useEffect(() => {
    const refreshCheckpointsOnMount = async () => {
      try {
        console.log('AI: Refreshing checkpoints on component mount...');
        await verification.refreshCheckpoints();
        console.log('AI: Mount refresh completed, checkpoints:', verification.checkpoints?.length || 0);
      } catch (error) {
        console.error('AI: Failed to refresh checkpoints on mount:', error);
      }
    };
    
    // Add a small delay to ensure everything is initialized
    setTimeout(refreshCheckpointsOnMount, 1000);
  }, [verification.refreshCheckpoints]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getSystemPrompt = () => {
    return config.systemPrompt;
  };

  const executeQuery = async (sqlQuery: string): Promise<unknown[]> => {
    try {
      return await database.executeQuery(sqlQuery);
    } catch (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  };

  const executeLedgerVerification = async (): Promise<unknown> => {
    try {
      console.log('AI: Checking verification status...');
      console.log('AI: verification.isRunning:', verification.isRunning);
      console.log('AI: verification.progress:', verification.progress);
      console.log('AI: verification.checkpoints:', verification.checkpoints);
      console.log('AI: verification.checkpoints.length:', verification.checkpoints?.length || 0);

      // First check if there's an active verification running
      if (verification.isRunning && verification.progress) {
        console.log('AI: Found active verification');
        const isComplete = verification.progress.status === 'completed';
        const hasError = !!verification.error;
        const progress = verification.progress.totalTransactions > 0 
          ? (verification.progress.currentTransaction / verification.progress.totalTransactions) * 100 
          : 0;
        
        return {
          status: verification.progress.status,
          progress: progress,
          currentTransaction: verification.progress.currentTransaction,
          totalTransactions: verification.progress.totalTransactions,
          processedFiles: verification.progress.processedFiles,
          totalFiles: verification.progress.totalFiles,
          currentFileName: verification.progress.currentFileName,
          isComplete,
          isVerified: isComplete && !hasError,
          error: verification.error,
          message: isComplete 
            ? (hasError ? 'Ledger verification failed' : 'Ledger verification completed successfully')
            : `Verification in progress: ${progress.toFixed(1)}% (${verification.progress.currentTransaction}/${verification.progress.totalTransactions} transactions)`
        };
      }

      // Check for any completed checkpoints from previous sessions
      if (verification.checkpoints && verification.checkpoints.length > 0) {
        console.log('AI: Found checkpoints, count:', verification.checkpoints.length);
        console.log('AI: Checkpoints:', verification.checkpoints);
        
        // Find the most recent checkpoint
        const latestCheckpoint = verification.checkpoints
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        console.log('AI: Latest checkpoint:', latestCheckpoint);
        
        if (latestCheckpoint) {
          const isCompleted = latestCheckpoint.status === 'pass';
          const hasError = latestCheckpoint.status === 'fail';
          const isStopped = latestCheckpoint.status === 'stopped';
          
          return {
            status: isCompleted ? 'completed' : hasError ? 'failed' : 'stopped',
            lastVerifiedTransaction: latestCheckpoint.lastVerifiedTransaction,
            totalTransactionsProcessed: latestCheckpoint.totalTransactionsProcessed,
            currentFileIndex: latestCheckpoint.currentFileIndex,
            lastVerifiedFile: latestCheckpoint.lastVerifiedFile,
            isComplete: isCompleted,
            isVerified: isCompleted && !hasError,
            sessionId: latestCheckpoint.id,
            timestamp: new Date(latestCheckpoint.timestamp).toLocaleString(),
            failureDetails: latestCheckpoint.failureDetails,
            message: isCompleted 
              ? 'Ledger verification completed successfully'
              : hasError 
                ? `Ledger verification failed: ${latestCheckpoint.failureDetails?.errorMessage || 'Unknown error'}`
                : isStopped 
                  ? `Verification was stopped after processing ${latestCheckpoint.totalTransactionsProcessed} transactions. Use resume to continue.`
                  : `Previous verification processed ${latestCheckpoint.totalTransactionsProcessed} transactions`,
            debugInfo: {
              checkpointStatus: latestCheckpoint.status,
              checkpointTimestamp: latestCheckpoint.timestamp,
              isCompleted,
              hasError,
              isStopped
            }
          };
        }
      }

      console.log('AI: No verification or checkpoints found');
      
      // No verification found - but let's try to refresh checkpoints and check again
      console.log('AI: Attempting to refresh checkpoints...');
      try {
        await verification.refreshCheckpoints();
        console.log('AI: Checkpoints refreshed, new count:', verification.checkpoints?.length || 0);
        
        if (verification.checkpoints && verification.checkpoints.length > 0) {
          console.log('AI: Found checkpoints after refresh!');
          const latestCheckpoint = verification.checkpoints
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          
          const isCompleted = latestCheckpoint.status === 'pass';
          const hasError = latestCheckpoint.status === 'fail';
          
          return {
            status: isCompleted ? 'completed' : hasError ? 'failed' : 'stopped',
            lastVerifiedTransaction: latestCheckpoint.lastVerifiedTransaction,
            totalTransactionsProcessed: latestCheckpoint.totalTransactionsProcessed,
            message: isCompleted 
              ? 'Ledger verification completed successfully (found after refresh)'
              : hasError 
                ? `Ledger verification failed: ${latestCheckpoint.failureDetails?.errorMessage || 'Unknown error'}`
                : `Verification was stopped after processing ${latestCheckpoint.totalTransactionsProcessed} transactions`,
            refreshedCheckpoints: true
          };
        }
      } catch (refreshError) {
        console.error('AI: Failed to refresh checkpoints:', refreshError);
      }
      
      // Direct IndexedDB check as a last resort
      console.log('AI: Trying direct IndexedDB check...');
      try {
        const directCheckpoints = await checkIndexedDBForCheckpoints();
        console.log('AI: Direct IndexedDB found:', directCheckpoints.length, 'checkpoints');
        
        if (directCheckpoints.length > 0) {
          const latestCheckpoint = directCheckpoints
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          
          console.log('AI: Latest checkpoint from direct check:', latestCheckpoint);
          
          const isCompleted = latestCheckpoint.status === 'pass';
          const hasError = latestCheckpoint.status === 'fail';
          
          return {
            status: isCompleted ? 'completed' : hasError ? 'failed' : 'stopped',
            lastVerifiedTransaction: latestCheckpoint.lastVerifiedTransaction,
            totalTransactionsProcessed: latestCheckpoint.totalTransactionsProcessed,
            message: isCompleted 
              ? 'Ledger verification completed successfully (found via direct IndexedDB check)'
              : hasError 
                ? `Ledger verification failed: ${latestCheckpoint.failureDetails?.errorMessage || 'Unknown error'}`
                : `Verification was stopped after processing ${latestCheckpoint.totalTransactionsProcessed} transactions`,
            foundViaDirectCheck: true,
            hookCheckpointsCount: verification.checkpoints?.length || 0
          };
        }
      } catch (directError) {
        console.error('AI: Direct IndexedDB check failed:', directError);
      }

      return {
        status: 'not_started',
        message: 'No ledger verification has been started. Please start verification manually from the verification page.',
        isRunning: verification.isRunning,
        hasProgress: !!verification.progress,
        availableCheckpoints: verification.checkpoints?.length || 0,
        debugInfo: {
          hookState: {
            isRunning: verification.isRunning,
            hasProgress: !!verification.progress,
            checkpointsLength: verification.checkpoints?.length || 0,
            currentSessionId: verification.currentSessionId
          }
        }
      };
    } catch (error) {
      console.error('Ledger verification error:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown verification error',
        message: 'Failed to execute ledger verification'
      };
    }
  };

  const executeReceiptVerification = async (receiptJson?: string, networkCert?: string): Promise<unknown> => {
    try {
      if (!receiptJson || !networkCert) {
        return {
          status: 'error',
          error: 'Both receipt JSON and network certificate are required for verification',
          message: 'Please provide both the write receipt JSON and network certificate'
        };
      }

      // Parse the receipt
      let receipt: WriteReceipt;
      try {
        receipt = JSON.parse(receiptJson);
      } catch (error) {
        return {
          status: 'error',
          error: 'Invalid receipt JSON format',
          message: 'The provided receipt JSON is not valid'
        };
      }

      // For now, return a message that receipt verification needs to be implemented
      // with proper database integration
      return {
        status: 'not_implemented',
        message: 'Receipt verification against ledger database is not yet implemented in the AI assistant. Please use the Write Receipt Verification page for full verification.',
        receiptStructure: {
          cert: !!receipt.cert,
          nodeId: receipt.nodeId,
          signature: !!receipt.signature,
          proof: receipt.proof?.length || 0,
          leafComponents: !!receipt.leafComponents
        }
      };
    } catch (error) {
      console.error('Receipt verification error:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown verification error',
        message: 'Failed to execute receipt verification'
      };
    }
  };

  const callOpenAIResponseAPI = async (messages: ChatMessage[], newMessage: string): Promise<{ id: string; text: string }> => {
    if (!config.baseUrl) {
      throw new Error('Base URL is required to send the request');
    }

    let input = '';
    // collect prior conversations as history for this question
    messages.forEach(m => {
      input += `${m.role} said: ${m.content}\n`;
      if (m.sqlResult) {
        input += `\nSQL Query Result: ${JSON.stringify(m.sqlResult, null, 2)}\n`;
      }
    });

    const previousResponseId = messages.length > 0 ? messages[messages.length - 1].responseId : null;

    input += `User asks: ${newMessage}\n`;

    const response = await fetch(config.baseUrl + '/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: input,
        instructions: getSystemPrompt(),
        previous_response_id: previousResponseId,
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let concatenatedResponse = "";
    if (data.output && data.output.length > 0) {
      for (const output of data.output) {
        if (output.type === 'message') {
          for (const messageContent of output.content) {
            if (messageContent.type === 'output_text') {
              concatenatedResponse += `${messageContent.text}\n\n`;
            } else {
              concatenatedResponse += `> Using: ${messageContent.type}\n\n`;
            }
          }
        } else {
          concatenatedResponse += `> Using: ${output.type}\n\n`;
        }
      }
    }
    return {
      id: data.id || '',
      text: concatenatedResponse || 'No response received'
    };
  };

  const extractSqlQuery = (content: string): string | null => {
    const sqlMatch = content.match(/```sql\n([\s\S]*?)\n```/);
    const query = sqlMatch ? sqlMatch[1].trim() : null;
    
    // Don't treat verification commands as SQL queries
    if (query && (query.includes('VERIFY_LEDGER') || query.includes('VERIFY_RECEIPT'))) {
      return null;
    }
    
    return query;
  };

  const extractVerificationCommand = (content: string): 'ledger' | 'receipt' | null => {
    if (content.includes('VERIFY_LEDGER')) {
      return 'ledger';
    }
    if (content.includes('VERIFY_RECEIPT')) {
      return 'receipt';
    }
    return null;
  };

  const handleSendMessage = async (optionalMessage?: string) => {
    if (isLoading || (!optionalMessage && !currentMessage.trim())) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: optionalMessage || currentMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Get AI response
      const aiResponse = await callOpenAIResponseAPI(messages, userMessage.content);
      
      // Check if the response contains a SQL query
      const sqlQuery = extractSqlQuery(aiResponse.text);
      
      // Check if the response contains a verification command
      const verificationCommand = extractVerificationCommand(aiResponse.text);
      
      let sqlResult: unknown[] | undefined;
      let verificationResult: unknown | undefined;
      let executionError: string | undefined;

      // Execute SQL query if present
      if (sqlQuery) {
        try {
          sqlResult = await executeQuery(sqlQuery);
        } catch (err) {
          executionError = err instanceof Error ? err.message : 'SQL execution failed';
        }
      }

      // Execute verification command if present
      if (verificationCommand) {
        try {
          if (verificationCommand === 'ledger') {
            verificationResult = await executeLedgerVerification();
          } else if (verificationCommand === 'receipt') {
            verificationResult = await executeReceiptVerification();
          }
        } catch (err) {
          executionError = err instanceof Error ? err.message : 'Verification execution failed';
        }
      }

      const assistantMessage: ChatMessage = {
        id: aiResponse.id || (Date.now() + 1).toString(),
        responseId: aiResponse.id,
        role: 'assistant',
        content: aiResponse.text,
        sqlQuery: sqlQuery || undefined,
        sqlResult,
        verificationAction: verificationCommand || undefined,
        verificationResult,
        error: executionError,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startFromExample = (example: string) => {
    setMessages([]);
    setError(null);
    setCurrentMessage(example);
    handleSendMessage(example);
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const formatSqlResult = (result: unknown[]): string => {
    if (!result || result.length === 0) {
      return 'No results found';
    }

    if (result.length === 1 && typeof result[0] === 'object') {
      const obj = result[0] as Record<string, unknown>;
      const keys = Object.keys(obj);
      if (keys.length === 1) {
        return `${keys[0]}: ${obj[keys[0]]}`;
      }
    }

    return JSON.stringify(result, null, 2);
  };

  return (
    <div className={styles.container}>
      <div className={styles.chatPane}>
        <Card className={styles.chatCard}>
          
          <div>
            { error || messages.length > 0 ? (<div className={styles.chatHeader}>
              <Button onClick={clearChat} appearance="outline">
                New conversation
              </Button>
            </div>) : null }
          </div>

          {/* Messages Area */}
          <div className={styles.messagesArea}>

            {/* Starter templates when no conversation is present */}
            {messages.length === 0 && (
              <div>
                <CompoundButton
                  icon={<ChatAddRegular />}
                  secondaryContent="How does MAA’s attestation work?"
                  appearance="transparent"
                  onClick={() => startFromExample("How does MAA’s attestation work?")}
                >
                  Azure Attestation
                </CompoundButton>

                <CompoundButton
                  icon={<ChatAddRegular />}
                  secondaryContent="How can I trust MAA?"
                  appearance="transparent"
                  onClick={() => startFromExample("How can I trust MAA?")}
                >
                  Azure Attestation
                </CompoundButton>

                <CompoundButton
                  icon={<ChatAddRegular />}
                  secondaryContent="Can you verify that MAA is transparent right now?"
                  appearance="transparent"
                  onClick={() => startFromExample("Can you verify that MAA is transparent right now?")}
                >
                  Transparency
                </CompoundButton>

                { allTransactionsCount && allTransactionsCount > 0 ? (<>
                  <CompoundButton
                    icon={<ChatAddRegular />}
                    secondaryContent="Can you show me the history of MAA builds?"
                    appearance="transparent"
                    onClick={() => startFromExample("Can you show me the history of MAA builds?")}
                  >
                    Transparency
                  </CompoundButton>
                  <CompoundButton
                    icon={<ChatAddRegular />}
                    secondaryContent="How many transactions are in the database?"
                    appearance="transparent"
                    onClick={() => startFromExample("How many transactions are in the database?")}
                  >
                    Ledger
                  </CompoundButton>
                  <CompoundButton
                    icon={<ChatAddRegular />}
                    secondaryContent="Show me recent transactions"
                    appearance="transparent"
                    onClick={() => startFromExample("Show me recent transactions")}
                  >
                    Ledger
                  </CompoundButton>
                  <CompoundButton
                    icon={<ChatAddRegular />}
                    secondaryContent="Find transactions with specific keys"
                    appearance="transparent"
                    onClick={() => startFromExample("Find transactions with specific keys")}
                  >
                    Ledger
                  </CompoundButton>
                </>) : null }
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={styles.messageContainer}>
                <div className={`${styles.messageAvatar} ${message.role === 'user' ? styles.userAvatar : styles.assistantAvatar}`}>
                  {message.role === 'user' ? <Person24Regular /> : <Bot24Regular />}
                </div>
                
                <div className={styles.messageContent}>
                  <div className={`${styles.messageBubble} ${message.role === 'user' ? styles.userBubble : styles.assistantBubble}`}>
                    <Text className={styles.messageText}>
                      {message.content}
                    </Text>
                    
                    {message.sqlQuery && (
                      <div className={styles.sqlSection}>
                        <Text size={200} weight="semibold" className={styles.sqlHeader}>
                          SQL Query:
                        </Text>
                        <pre className={styles.sqlQuery}>
                          {message.sqlQuery}
                        </pre>
                      </div>
                    )}
                    
                    {message.sqlResult && (
                      <div className={styles.sqlSection}>
                        <Text size={200} weight="semibold" className={styles.sqlResultHeader}>
                          Result:
                        </Text>
                        <pre className={styles.sqlResult}>
                          {formatSqlResult(message.sqlResult)}
                        </pre>
                      </div>
                    )}
                    
                    {(message.verificationResult !== undefined && message.verificationResult !== null) && (
                      <div className={styles.sqlSection}>
                        <Text size={200} weight="semibold" className={styles.sqlResultHeader}>
                          {message.verificationAction === 'ledger' ? 'Ledger Verification:' : 'Receipt Verification:'}
                        </Text>
                        <pre className={styles.sqlResult}>
                          {typeof message.verificationResult === 'string' 
                            ? message.verificationResult 
                            : JSON.stringify(message.verificationResult, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {message.error && (
                      <div className={styles.errorSection}>
                        <MessageBar intent="error">
                          <Text size={200}>Error: {message.error}</Text>
                        </MessageBar>
                      </div>
                    )}
                  </div>
                  
                  <Text size={100} className={styles.messageTimestamp}>
                    {message.timestamp.toLocaleTimeString()}
                  </Text>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className={styles.loadingContainer}>
                <Spinner size="tiny" />
                <Text size={200}>AI is thinking...</Text>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area with optional error display above it */}
          <div style={{ position: 'relative' }}>
            {error && (
              <div className={styles.errorContainer}>
                <MessageBar intent="error">
                  {error}
                </MessageBar>
              </div>
            )}

            <div className={styles.inputArea}>
              <Textarea
                placeholder="Ask me what can I do"
                value={currentMessage}
                onChange={(_, data) => setCurrentMessage(data.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                resize="none"
                className={styles.inputTextarea}
              />
              <Button
                appearance="primary"
                icon={<Send24Regular />}
                onClick={() => handleSendMessage()}
                disabled={!currentMessage.trim() || isLoading || !config.baseUrl}
              />
            </div>
          </div>

        </Card>
      </div>
    </div>
  );
};
