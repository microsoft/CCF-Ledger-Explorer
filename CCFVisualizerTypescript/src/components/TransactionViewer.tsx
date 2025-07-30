import React, { useState } from 'react';
import {
  makeStyles,
  Text,
  Caption1,
  Button,
  Card,
  Badge,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Tab,
  TabList,
} from '@fluentui/react-components';
import type { TabValue } from '@fluentui/react-components';
import {
  ChevronLeft24Regular,
  ChevronRight24Regular,
  Info24Regular,
  Code24Regular,
  Database24Regular,
  Delete24Regular,
  Eye24Regular,
} from '@fluentui/react-icons';
import { useTransactions, useTransactionDetails } from '../hooks/use-ccf-data';
import { EntryType } from '../types/ccf-types';
import { ValueViewer } from './ValueViewer';

const useStyles = makeStyles({
  container: {
    padding: '24px',
    height: '80vh',
    overflowY: 'scroll',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  transactionCard: {
    marginBottom: '16px',
  },
  transactionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  transactionMeta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '16px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metaLabel: {
    fontWeight: '600',
    color: 'var(--colorNeutralForeground1)',
  },
  metaValue: {
    color: 'var(--colorNeutralForeground2)',
    fontFamily: 'monospace',
  },
  kvTable: {
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  hexValue: {
    fontFamily: 'monospace',
    fontSize: '12px',
    wordBreak: 'break-all',
    maxWidth: '300px',
  },
  entryTypeBadge: {
    textTransform: 'uppercase',
  },
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    color: 'var(--colorNeutralForeground3)',
  },
  dialogContent: {
    maxHeight: '70vh',
    overflow: 'auto',
  },
  accordionContent: {
    padding: '16px',
  },
});

interface TransactionViewerProps {
  fileId: number;
  fileName?: string;
  transactionId?: number; // Optional prop to show specific transaction
}

export const TransactionViewer: React.FC<TransactionViewerProps> = ({ 
  fileId, 
  fileName,
  transactionId 
}) => {
  const styles = useStyles();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<number | null>(transactionId || null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabValue>('writes');
  const [dialogSelectedTab, setDialogSelectedTab] = useState<TabValue>('writes');
  
  const handleTransactionClick = (transactionId: number) => {
    setSelectedTransaction(transactionId);
    setIsDetailsDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  
  const pageSize = 20;
  const offset = currentPage * pageSize;
  
  const { data: transactions, isLoading, error } = useTransactions(fileId, pageSize, offset);
  const { data: transactionDetails } = useTransactionDetails(selectedTransaction || 0);

  // If a specific transaction is requested, show it directly
  if (transactionId && transactionDetails) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Text size={500} weight="semibold">
            Transaction Details
          </Text>
        </div>
        
        {/* Transaction Details */}
        <div>
          <TabList selectedValue={selectedTab} onTabSelect={(_, data) => setSelectedTab(data.value)}>
            {transactionDetails.writes.length > 0 && (
              <Tab value="writes" icon={<Code24Regular />}>
                Key-Value Writes ({transactionDetails.writes.length})
              </Tab>
            )}
            {transactionDetails.deletes.length > 0 && (
              <Tab value="deletes" icon={<Delete24Regular />}>
                Key Deletes ({transactionDetails.deletes.length})
              </Tab>
            )}
          </TabList>

          {/* Writes Tab Content */}
          {selectedTab === 'writes' && transactionDetails.writes.length > 0 && (
            <div className={styles.accordionContent} style={{ marginTop: '16px' }}>
              {transactionDetails.writes.map((write, index) => (
                <div key={index} style={{ marginBottom: '24px' }}>
                  <ValueViewer
                    keyName={write.key}
                    value={write.value}
                    tableName={write.key.includes(':') ? write.key.split('/')[0] : undefined}
                  />
                  <Text 
                    style={{ 
                      fontSize: '12px', 
                      color: 'var(--colorNeutralForeground3)',
                      marginTop: '8px',
                      fontFamily: 'monospace'
                    }}
                  >
                    Version: {write.version}
                  </Text>
                </div>
              ))}
            </div>
          )}

          {/* Deletes Tab Content */}
          {selectedTab === 'deletes' && transactionDetails.deletes.length > 0 && (
            <div className={styles.accordionContent} style={{ marginTop: '16px' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Key</TableHeaderCell>
                    <TableHeaderCell>Version</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionDetails.deletes.map((del, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TableCellLayout>
                          <Text className={styles.metaValue}>{del.key}</Text>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>
                        <TableCellLayout>
                          <Text className={styles.metaValue}>{del.version}</Text>
                        </TableCellLayout>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Empty State */}
          {transactionDetails.writes.length === 0 && transactionDetails.deletes.length === 0 && (
            <div className={styles.emptyState}>
              <Text>No key-value operations found in this transaction.</Text>
            </div>
          )}
        </div>
      </div>
    );
  }

  const getEntryTypeName = (entryType: number): string => {
    switch (entryType) {
      case EntryType.WriteSet:
        return 'Write Set';
      case EntryType.WriteSetWithClaims:
        return 'Write Set (with Claims)';
      case EntryType.WriteSetWithCommitEvidence:
        return 'Write Set (with Commit Evidence)';
      case EntryType.WriteSetWithCommitEvidenceAndClaims:
        return 'Write Set (with Claims & Evidence)';
      case EntryType.Snapshot:
        return 'Snapshot';
      default:
        return `Unknown (${entryType})`;
    }
  };

  const getEntryTypeColor = (entryType: number): 'success' | 'danger' | 'important' | 'subtle' => {
    switch (entryType) {
      case EntryType.WriteSet:
      case EntryType.WriteSetWithClaims:
      case EntryType.WriteSetWithCommitEvidence:
      case EntryType.WriteSetWithCommitEvidenceAndClaims:
        return 'success';
      case EntryType.Snapshot:
        return 'important';
      default:
        return 'subtle';
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <Spinner size="large" label="Loading transactions..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Text size={500}>Error loading transactions: {error.message}</Text>
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Database24Regular style={{ fontSize: '48px', marginBottom: '16px' }} />
          <Text size={500} weight="semibold">No transactions found</Text>
          <Caption1 style={{ marginTop: '8px' }}>
            This file doesn't contain any parseable transactions.
          </Caption1>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Text size={600} weight="semibold">
            Transactions {fileName ? `- ${fileName}` : ''}
          </Text>
          <Caption1>
            Showing {offset + 1}-{Math.min(offset + pageSize, offset + transactions.length)} transactions
          </Caption1>
        </div>
        
        <div className={styles.pagination}>
          <Button
            appearance="subtle"
            icon={<ChevronLeft24Regular />}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <Text>Page {currentPage + 1}</Text>
          <Button
            appearance="subtle"
            icon={<ChevronRight24Regular />}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={transactions.length < pageSize}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className={styles.kvTable}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Sequence</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Version</TableHeaderCell>
              <TableHeaderCell>Size</TableHeaderCell>
              <TableHeaderCell>TX Version</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  <TableCellLayout>
                    <Text weight="semibold">{tx.id}</Text>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Badge 
                      appearance="outline" 
                      color={getEntryTypeColor(tx.entryType)}
                      className={styles.entryTypeBadge}
                    >
                      {getEntryTypeName(tx.entryType)}
                    </Badge>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Text className={styles.metaValue}>{tx.version}</Text>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Text className={styles.metaValue}>{tx.size} bytes</Text>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Text className={styles.metaValue}>{tx.txVersion}</Text>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Eye24Regular />}
                      onClick={() => handleTransactionClick(tx.id)}
                    >
                      View Details
                    </Button>
                  </TableCellLayout>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={(_event, data) => setIsDetailsDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            <DialogBody>
              {selectedTransaction && transactionDetails ? (
                <div>
                  <TabList selectedValue={dialogSelectedTab} onTabSelect={(_, data) => setDialogSelectedTab(data.value)}>
                    {transactionDetails.writes.length > 0 && (
                      <Tab value="writes" icon={<Code24Regular />}>
                        Key-Value Writes ({transactionDetails.writes.length})
                      </Tab>
                    )}
                    {transactionDetails.deletes.length > 0 && (
                      <Tab value="deletes" icon={<Delete24Regular />}>
                        Key Deletes ({transactionDetails.deletes.length})
                      </Tab>
                    )}
                  </TabList>

                  {/* Writes Tab Content */}
                  {dialogSelectedTab === 'writes' && transactionDetails.writes.length > 0 && (
                    <div className={styles.accordionContent} style={{ marginTop: '16px' }}>
                      {transactionDetails.writes.map((write, index) => (
                        <div key={index} style={{ marginBottom: '32px' }}>
                          <ValueViewer
                            keyName={write.key}
                            value={write.value}
                            tableName={write.key.includes(':') ? write.key.split('/')[0] : undefined}
                          />
                          <Text 
                            style={{ 
                              fontSize: '12px', 
                              color: 'var(--colorNeutralForeground3)',
                              marginTop: '8px',
                              fontFamily: 'monospace'
                            }}
                          >
                            Version: {write.version}
                          </Text>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Deletes Tab Content */}
                  {dialogSelectedTab === 'deletes' && transactionDetails.deletes.length > 0 && (
                    <div className={styles.accordionContent} style={{ marginTop: '16px' }}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Key</TableHeaderCell>
                            <TableHeaderCell>Version</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactionDetails.deletes.map((del, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <TableCellLayout>
                                  <Text className={styles.metaValue}>{del.key}</Text>
                                </TableCellLayout>
                              </TableCell>
                              <TableCell>
                                <TableCellLayout>
                                  <Text className={styles.metaValue}>{del.version}</Text>
                                </TableCellLayout>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* No Data Message */}
                  {transactionDetails.writes.length === 0 && transactionDetails.deletes.length === 0 && (
                    <div className={styles.emptyState}>
                      <Info24Regular style={{ fontSize: '24px', marginBottom: '8px' }} />
                      <Text>This transaction contains no key-value operations.</Text>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.loadingState}>
                  <Spinner size="medium" label="Loading transaction details..." />
                </div>
              )}
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
