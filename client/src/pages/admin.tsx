import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface UserConversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    userCode: string;
  };
  lastMessageAt: Date | null;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  userCode: string;
  phone: string | null;
  fullName: string;
  subscriptionType: string;
  subscriptionExpiresAt: Date | null;
  isPhoneVerified: boolean;
  isSetupComplete: boolean;
  dailyMessageCount: number;
  lastMessageDate: Date | null;
  createdAt: Date;
  conversations: UserConversation[];
}

export default function AdminPage() {
  const [, setLocation] = useLocation();

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
          <p>Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/20 mr-3"
          onClick={() => setLocation("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2">All Users</h2>
          <p className="text-muted-foreground">
            Total users: {users.length}
          </p>
        </div>

        {/* Users Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>User Code</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Messages/Day</TableHead>
                <TableHead>Conversations</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.username}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {user.userCode}
                    </code>
                  </TableCell>
                  <TableCell>{user.phone || "—"}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        variant={
                          user.subscriptionType === "premium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {user.subscriptionType}
                      </Badge>
                      {user.subscriptionType === "premium" &&
                        user.subscriptionExpiresAt && (
                          <div className="text-xs text-muted-foreground">
                            Until{" "}
                            {new Date(
                              user.subscriptionExpiresAt
                            ).toLocaleDateString()}
                          </div>
                        )}
                      {user.isPhoneVerified && (
                        <Badge variant="outline" className="text-xs">
                          Phone ✓
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.dailyMessageCount || 0}/
                    {user.subscriptionType === "premium" ? "∞" : "1"}
                  </TableCell>
                  <TableCell>
                    {user.conversations.length > 0 ? (
                      <div className="space-y-1">
                        {user.conversations.map((conv) => (
                          <div
                            key={conv.id}
                            className="text-xs bg-muted px-2 py-1 rounded"
                          >
                            <div className="font-medium">
                              {conv.otherUser.username}
                            </div>
                            <div className="text-muted-foreground">
                              ID: {conv.id.substring(0, 8)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        No conversations
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}
