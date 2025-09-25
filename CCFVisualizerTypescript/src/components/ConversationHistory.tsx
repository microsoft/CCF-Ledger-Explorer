import React, { useEffect, useState } from 'react';
import { makeStyles, shorthands, tokens, Button, Text, Spinner, MessageBar } from '@fluentui/react-components';
import { DeleteRegular, ChevronLeftRegular, ChevronRightRegular, ChatRegular } from '@fluentui/react-icons';
import type { ConversationHistoryProps, SavedConversation } from '../types/conversation-types';
import type { ChatMessage } from './AIChat';

const STORAGE_KEY = 'ccf-saved-conversations';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    transition: 'width 0.2s ease',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  expanded: {
    width: '300px',
  },
  collapsed: {
    width: '48px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('12px', '12px'),
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  list: {
    flex: 1,
    overflowY: 'auto',
  },
  item: {
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('10px', '12px'),
    ...shorthands.gap('4px'),
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  active: {
    backgroundColor: tokens.colorBrandBackground2,
    '&:hover': { backgroundColor: tokens.colorBrandBackground2 },
  },
  itemTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: 1.3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  date: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  deleteBtn: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    opacity: 0,
    transition: 'opacity 0.15s',
    minWidth: '24px',
    width: '24px',
    height: '24px',
    '&:hover': {
      color: tokens.colorPaletteRedForeground2,
      backgroundColor: tokens.colorPaletteRedBackground2,
    },
  },
  // Hover handled via React state now
  collapsedContent: {
  display: 'none', // no longer show extra icons when collapsed
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    ...shorthands.padding('32px', '12px'),
    ...shorthands.gap('8px'),
    color: tokens.colorNeutralForeground3,
  },
});

const formatDisplayDate = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / 36e5;
  if (diffHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffHours < 24 * 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  onConversationSelect,
  onNewConversation,
  activeConversationId,
  isCollapsed,
  onToggleCollapse,
  refreshSignal,
}) => {
  const styles = useStyles();
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const load = () => {
    try {
      setLoading(true);
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { setConversations([]); return; }
      const parsed = JSON.parse(raw) as SavedConversation[];
      setConversations(parsed);
    } catch (e) {
      console.error(e);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [refreshSignal]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = conversations.filter(c => c.id !== id);
      setConversations(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (activeConversationId === id) onNewConversation();
    } catch(err) {
      console.error(err);
      setError('Failed to delete');
    }
  };

  if (isCollapsed) {
    return (
      <div className={`${styles.root} ${styles.collapsed}`}>
        <div className={styles.header}>
          <Button appearance="subtle" icon={<ChevronRightRegular />} onClick={onToggleCollapse} title="Expand" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.root} ${styles.expanded}`}>
      <div className={styles.header}>
        <Text className={styles.title}>Conversations</Text>
        <Button appearance="subtle" icon={<ChevronLeftRegular />} onClick={onToggleCollapse} title="Collapse" />
      </div>
      {error && <MessageBar intent="error" style={{ margin: '8px' }}>{error}</MessageBar>}
      <div className={styles.list}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}><Spinner size="small" /></div>
        ) : conversations.length === 0 ? (
          <div className={styles.empty}>
            <ChatRegular style={{ fontSize: 32 }} />
            <Text>No conversations yet. Start chatting.</Text>
          </div>
        ) : (
          conversations.map(c => (
            <div
              key={c.id}
              className={`${styles.item} ${c.id === activeConversationId ? styles.active : ''}`}
              onClick={() => onConversationSelect(c)}
              onMouseEnter={() => setHoveredId(c.id)}
              onMouseLeave={() => setHoveredId(id => (id === c.id ? null : id))}
            >
              <Text className={styles.itemTitle}>{c.title}</Text>
              <Text className={styles.date}>{formatDisplayDate(c.updatedAt)}</Text>
              <Button
                appearance="subtle"
                icon={<DeleteRegular />}
                className={styles.deleteBtn + ' delete-btn'}
                title="Delete"
                style={{ opacity: hoveredId === c.id ? 1 : 0 }}
                onClick={(e) => handleDelete(c.id, e)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Helper for saving conversations
export const saveConversationToHistory = (messages: ChatMessage[]) => {
  if (!messages.length) return;
  const firstUser = messages.find(m => m.role === 'user');
  const titleBase = firstUser?.content?.trim() || 'New Conversation';
  const title = titleBase.slice(0, 30) + (titleBase.length > 30 ? '...' : '');
  const id = 'conv-' + Date.now();
  const now = new Date().toISOString();
  const toStore: SavedConversation = {
    id,
    title,
    messages: messages.map(m => ({
      id: m.id,
      state: (m as any).state || 'finished',
      role: m.role as 'user' | 'assistant',
      responseId: (m as any).responseId,
      content: m.content,
      timestamp: (m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)).toISOString(),
      error: (m as any).error,
      actions: (m as any).actions,
      receiptData: (m as any).receiptData,
    })),
    createdAt: now,
    updatedAt: now,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: SavedConversation[] = raw ? JSON.parse(raw) : [];
    existing.unshift(toStore);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save conversation', e);
  }
  return id;
};
