import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, Clock, Mail, MessageSquare, Phone, Send, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";

type EnrolledCourse = {
  id: string;
  title: string;
};

type UserData = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  enrolled_courses: EnrolledCourse[];
};

// Individual row component to manage input state independently
function UserRow({ user, onDelete }: { user: UserData; onDelete: (id: string) => void }) {
  const [emailMsg, setEmailMsg] = useState("");
  const [smsMsg, setSmsMsg] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const shortId = user.user_id.substring(0, 8);
  const lastActive = user.last_sign_in_at
    ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
    : "Never";
  const joinedAt = formatDistanceToNow(new Date(user.created_at), { addSuffix: true });

  const handleSendEmail = async () => {
    if (!emailMsg.trim()) return;
    setSendingEmail(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`Sending email to ${user.email}: ${emailMsg}`);
    toast({
      title: "Email Sent (Simulation)",
      description: `Message sent to ${user.email}`,
    });

    setEmailMsg("");
    setSendingEmail(false);
  };

  const handleSendSms = async () => {
    if (!smsMsg.trim()) return;
    setSendingSms(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`Sending SMS to ${user.phone}: ${smsMsg}`);
    toast({
      title: "SMS Sent (Simulation)",
      description: `Message sent to ${user.phone}`,
    });

    setSmsMsg("");
    setSendingSms(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    setIsDeleting(true);
    try {
      // Pass _user_id to match the SQL function parameter name
      const { error } = await (supabase as any).rpc("delete_user_by_id", { _user_id: user.user_id });
      if (error) throw error;

      toast({ title: "User deleted", description: "The user has been permanently removed." });
      onDelete(user.user_id);
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group rounded-xl border border-border/50 bg-card/20 p-4 shadow-sm transition-all hover:bg-card/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

        {/* User Identity - Fixed Width */}
        <div className="min-w-[280px] lg:w-[30%]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="font-bold text-base md:text-lg leading-tight">{user.full_name || "Unnamed"}</div>
                <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                  {shortId}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] sm:text-xs text-muted-foreground">
                <span className="flex items-center gap-1" title={new Date(user.created_at).toLocaleString()}>
                  <Clock className="h-3 w-3" /> {joinedAt}
                </span>
                <span className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${user.last_sign_in_at ? "bg-green-500" : "bg-gray-400"}`} />
                  {lastActive}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] sm:text-xs text-muted-foreground">
                {user.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-primary/70" /> {user.email}
                  </span>
                )}
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-primary/70" /> {user.phone}
                  </span>
                )}
              </div>

              {/* Courses - Compact Inline */}
              {user.enrolled_courses && user.enrolled_courses.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {user.enrolled_courses.map((c) => (
                    <span key={c.id} className="inline-flex items-center rounded border border-border/40 bg-background/50 px-1 text-[9px] text-muted-foreground" title={c.title}>
                      <BookOpen className="mr-1 h-2.5 w-2.5" /> {c.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messaging & Actions - Flexible Row */}
        <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end lg:gap-4">

          {/* Email Input */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Mail className="hidden lg:block h-4 w-4 text-muted-foreground/50" />
            <div className="flex flex-1 gap-2">
              <Input
                placeholder={`Email to ${user.email?.split('@')[0]}...`}
                value={emailMsg}
                onChange={(e) => setEmailMsg(e.target.value)}
                className="h-8 text-xs bg-background/50"
              />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSendEmail} disabled={!user.email || sendingEmail}>
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* SMS Input */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Phone className="hidden lg:block h-4 w-4 text-muted-foreground/50" />
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="SMS..."
                value={smsMsg}
                onChange={(e) => setSmsMsg(e.target.value)}
                className="h-8 text-xs bg-background/50"
              />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSendSms} disabled={!user.phone || sendingSms}>
                <MessageSquare className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-destructive/70 hover:bg-destructive/10 hover:text-destructive self-end lg:self-center"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete User"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

        </div>

      </div>
    </div>
  );
}

export function UsersAdmin() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the custom RPC function to get extended user data
      const { data, error } = await (supabase as any).rpc("get_pro_users_data");

      if (error) {
        console.error("RPC Error:", error);
        if (error.message?.includes("function") && error.message?.includes("does not exist")) {
          throw new Error("Missing database function. Please run the provided SQL script.");
        }
        throw error;
      }

      setUsers(data || []);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const removeUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.user_id !== id));
  };

  const filteredUsers = users.filter((u) => {
    const searchStr = `${u.full_name || ""} ${u.email || ""} ${u.phone || ""}`.toLowerCase();
    return searchStr.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage users, view activity, and send notifications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search users..."
            className="w-full sm:w-64 bg-card/20 border-border/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="outline" onClick={loadUsers} disabled={loading} size="sm" className="shrink-0">
            {loading ? "..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
          <p className="font-bold">Error loading users</p>
          <p className="mb-4 mt-1 text-sm opacity-90">{error}</p>
          <Button variant="destructive" size="sm" onClick={loadUsers}>
            Try Again
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {loading
            ? // Loading Skeleton
            [1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/20" />)
            : filteredUsers.length === 0
              ? (
                <div className="py-12 text-center text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                  {searchQuery ? `No users found matching "${searchQuery}"` : "No users found."}
                </div>
              )
              : (
                filteredUsers.map((user) => <UserRow key={user.user_id} user={user} onDelete={removeUser} />)
              )}
        </div>
      )}
    </div>
  );
}
