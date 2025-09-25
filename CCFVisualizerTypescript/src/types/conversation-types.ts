// Conversation related shared types
// These will be used by ConversationHistory and AIPage

export interface SavedConversationMessage {
  id: string;
  state: 'initial' | 'streaming' | 'finished';
  role: 'user' | 'assistant';
  responseId?: string;
  content: string;
  timestamp: string; // stored as ISO string for localStorage
  error?: string;
  actions?: Array<{
    actionName: string;
    actionContent?: string;
    actionResult?: unknown;
    actionError?: string;
    cleanedResult?: string;
  }>;
  receiptData?: {
    receipt: unknown;
    networkCert: string;
  };
}

export interface SavedConversation {
  id: string;
  title: string;
  messages: SavedConversationMessage[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface ConversationHistoryProps {
  onConversationSelect: (conversation: SavedConversation) => void;
  onNewConversation: () => void;
  activeConversationId?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  refreshSignal?: number; // increment to trigger reload after save
}
