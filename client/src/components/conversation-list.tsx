import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface ConversationListProps {
  conversations: Array<{
    id: string;
    otherUser: {
      id: string;
      userCode: string;
      fullName: string | null;
    };
    lastMessage?: {
      content: string;
      createdAt: string;
    };
    lastMessageAt: string;
  }>;
}

export default function ConversationList({ conversations }: ConversationListProps) {
  const [, setLocation] = useLocation();

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="text-lg mb-2">No conversations yet</p>
        <p className="text-sm">Tap the + button to start your first secure conversation</p>
      </div>
    );
  }

  return (
    <div>
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className="border-b border-border p-4 hover:bg-muted cursor-pointer transition-colors"
          onClick={() => setLocation(`/conversation/${conversation.id}`)}
          data-testid={`conversation-${conversation.id}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium" data-testid={`fullname-${conversation.id}`}>
              {conversation.otherUser.fullName || conversation.otherUser.userCode}
            </span>
            <span className="text-sm text-muted-foreground" data-testid={`time-${conversation.id}`}>
              {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
            </span>
          </div>
          
          {conversation.lastMessage && (
            <p className="text-muted-foreground text-sm truncate" data-testid={`last-message-${conversation.id}`}>
              {conversation.lastMessage.content}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {conversation.otherUser.userCode}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
