import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo } from "react";
import {
  Mail,
  Trash2,
  Loader2,
  MessageSquare,
  Clock,
  Settings,
  Save,
  MapPin,
  Phone,
  GraduationCap,
  Search,
  X,
  CheckCheck,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | string;
  created_at: string;
  replied_at?: string | null;
  replied_by?: string | null;
};

export interface ParsedMessage extends Message {
  isMentorshipInquiry: boolean;
  targetMentor?: string;
  targetMentorId?: string;
  topic?: string;
  phone?: string;
  requesterStatus?: string;
  cleanMessage: string;
}

function parseMessage(m: Message): ParsedMessage {
  const isMentorship =
    m.subject?.toLowerCase().includes("mentorship inquiry") ||
    m.message?.includes("[MENTORSHIP INQUIRY]") ||
    m.message?.includes("[Mentorship Request");

  let targetMentor: string | undefined;
  let targetMentorId: string | undefined;
  let topic: string | undefined;
  let phone: string | undefined;
  let requesterStatus: string | undefined;
  let cleanMessage = m.message;

  if (isMentorship) {
    // Extract target mentor from subject
    const subMatch = m.subject?.match(/Mentorship Inquiry:\s*(.*)/i);
    if (subMatch && subMatch[1]) {
      targetMentor = subMatch[1].trim();
    }

    // Extract target mentor from envelope
    const mentorLine = m.message?.match(/Mentor:\s*([^\n\r]+)/i);
    if (mentorLine && mentorLine[1]) {
      targetMentor = mentorLine[1].trim();
    }

    const mentorIdLine = m.message?.match(/Mentor ID:\s*([^\n\r]+)/i);
    if (mentorIdLine && mentorIdLine[1]) {
      targetMentorId = mentorIdLine[1].trim();
    }

    const topicLine = m.message?.match(/(?:Topic|Technical Topic):\s*([^\n\r]+)/i);
    if (topicLine && topicLine[1]) {
      topic = topicLine[1].trim();
    }

    const phoneLine = m.message?.match(/Phone:\s*([^\n\r]+)/i);
    if (phoneLine && phoneLine[1] && phoneLine[1].toLowerCase() !== "not provided") {
      phone = phoneLine[1].trim();
    }

    const statusLine = m.message?.match(/Requester Status:\s*([^\n\r]+)/i);
    if (statusLine && statusLine[1]) {
      requesterStatus = statusLine[1].trim();
    }

    // Extract clean body after separator
    if (m.message?.includes("--------------------------------------------------")) {
      const parts = m.message.split("--------------------------------------------------");
      if (parts[1]) cleanMessage = parts[1].trim();
    } else if (m.message?.includes("]\n\n")) {
      const parts = m.message.split("]\n\n");
      if (parts[1]) cleanMessage = parts.slice(1).join("]\n\n").trim();
    }
  }

  return {
    ...m,
    isMentorshipInquiry: isMentorship,
    targetMentor,
    targetMentorId,
    topic,
    phone,
    requesterStatus,
    cleanMessage,
  };
}

export function MessagesAdmin() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Filter & Search State
  const [categoryFilter, setCategoryFilter] = useState<"all" | "inquiries" | "contact">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "read">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Settings State
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactHours, setContactHours] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMessages((data as any[]) || []);
    } catch (e: any) {
      toast({ title: "Failed to load messages", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const { data: settings } = await supabase
        .from("site_settings" as any)
        .select("*")
        .in("key", ["contact_email", "contact_phone", "contact_address", "contact_hours"]);

      if (settings) {
        settings.forEach((s: any) => {
          if (s.key === "contact_email") setContactEmail(s.value);
          if (s.key === "contact_phone") setContactPhone(s.value);
          if (s.key === "contact_address") {
            const addr = s.value
              ? s.value
                  .replace(/Bandladesh/gi, "Bangladesh")
                  .replace(/^25\/2\s*\.?\s*salimuddin market road,\s*mirpur-1,\s*dhaka,\s*bangladesh/i, "25/2, Salimuddin Market Road, Mirpur-1, Dhaka, Bangladesh")
              : "";
            setContactAddress(addr);
          }
          if (s.key === "contact_hours") setContactHours(s.value);
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    void loadMessages();
    void loadSettings();
  }, []);

  const markAsRead = async (id: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.from("messages").update({ status: "read" }).eq("id", id);
      if (error) throw error;
      await loadMessages();
      toast({ title: "Marked as read" });
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("messages").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Message deleted" });
      await loadMessages();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleReply = (msg: ParsedMessage) => {
    const greeting = `Hello ${msg.name},\n\n`;
    let body = "";
    if (msg.isMentorshipInquiry) {
      body = `${greeting}Thank you for reaching out regarding mentorship with ${msg.targetMentor || "IndustryMentor"}.\n\nRegarding your topic (${msg.topic || "Technical Advisory"}):\n\n`;
    } else {
      body = `${greeting}Thank you for contacting IndustryMentor regarding "${msg.subject}".\n\n`;
    }
    window.location.href = `mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(body)}`;
  };

  const saveSettings = async () => {
    setBusy(true);
    try {
      const updates = [
        { key: "contact_email", value: contactEmail },
        { key: "contact_phone", value: contactPhone },
        { key: "contact_address", value: contactAddress },
        { key: "contact_hours", value: contactHours },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("site_settings" as any)
          .upsert(update, { onConflict: "key" });
        if (error) throw error;
      }
      toast({ title: "Contact info updated successfully" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  // Parsed and classified messages
  const parsedMessages = useMemo(() => messages.map(parseMessage), [messages]);

  // Counts for tabs & badges
  const totalCount = messages.length;
  const inquiriesCount = useMemo(
    () => parsedMessages.filter((m) => m.isMentorshipInquiry).length,
    [parsedMessages]
  );
  const contactCount = totalCount - inquiriesCount;
  const newCount = useMemo(
    () => messages.filter((m) => m.status === "new").length,
    [messages]
  );
  const newInquiriesCount = useMemo(
    () => parsedMessages.filter((m) => m.isMentorshipInquiry && m.status === "new").length,
    [parsedMessages]
  );

  // Filtered messages
  const filteredMessages = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return parsedMessages.filter((m) => {
      // 1. Category Filter
      if (categoryFilter === "inquiries" && !m.isMentorshipInquiry) return false;
      if (categoryFilter === "contact" && m.isMentorshipInquiry) return false;

      // 2. Status Filter
      if (statusFilter === "new" && m.status !== "new") return false;
      if (statusFilter === "read" && m.status !== "read" && m.status !== "replied") return false;

      // 3. Search Query
      if (!query) return true;

      const nameMatch = m.name?.toLowerCase().includes(query);
      const emailMatch = m.email?.toLowerCase().includes(query);
      const subjectMatch = m.subject?.toLowerCase().includes(query);
      const mentorMatch = m.targetMentor?.toLowerCase().includes(query);
      const topicMatch = m.topic?.toLowerCase().includes(query);
      const messageMatch = m.message?.toLowerCase().includes(query);

      return nameMatch || emailMatch || subjectMatch || mentorMatch || topicMatch || messageMatch;
    });
  }, [parsedMessages, categoryFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">Message Center</h2>
          <p className="text-muted-foreground text-sm">
            Triage general inquiries and incoming practitioner mentorship requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadMessages} disabled={loading} className="text-xs">
            {busy || loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="inbox" className="space-y-6">
        <TabsList className="bg-card/50 p-1 rounded-xl border border-border/40">
          <TabsTrigger value="inbox" className="rounded-lg gap-2 text-xs font-semibold">
            <MessageSquare className="h-4 w-4" />
            Inbox
            {newCount > 0 && (
              <Badge variant="default" className="ml-1 h-5 px-1.5 text-[10px] bg-primary text-primary-foreground font-mono">
                {newCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg gap-2 text-xs font-semibold">
            <Settings className="h-4 w-4" />
            Contact Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-6">
          {/* Controls Strip: Category Tabs + Status + Search */}
          <div className="rounded-2xl border border-border/60 bg-card/25 p-4 backdrop-blur-xl shadow-elev space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Category Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  variant={categoryFilter === "all" ? "hero" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter("all")}
                  className="h-8 text-xs font-semibold rounded-lg px-3"
                >
                  All Messages
                  <span className="ml-1.5 opacity-80 font-mono text-[10px]">({totalCount})</span>
                </Button>

                <Button
                  type="button"
                  variant={categoryFilter === "inquiries" ? "hero" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter("inquiries")}
                  className="h-8 text-xs font-semibold rounded-lg px-3 gap-1.5"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  Mentorship Inquiries
                  <span className="ml-1 opacity-80 font-mono text-[10px]">({inquiriesCount})</span>
                  {newInquiriesCount > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-[9px] font-mono ml-0.5">
                      {newInquiriesCount} new
                    </Badge>
                  )}
                </Button>

                <Button
                  type="button"
                  variant={categoryFilter === "contact" ? "hero" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter("contact")}
                  className="h-8 text-xs font-semibold rounded-lg px-3 gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  General Contact
                  <span className="ml-1 opacity-80 font-mono text-[10px]">({contactCount})</span>
                </Button>
              </div>

              {/* Status Filter Toggle */}
              <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-border/50 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded font-semibold text-xs transition-colors ${
                    statusFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("new")}
                  className={`px-2.5 py-1 rounded font-semibold text-xs transition-colors ${
                    statusFilter === "new" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Unread ({newCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("read")}
                  className={`px-2.5 py-1 rounded font-semibold text-xs transition-colors ${
                    statusFilter === "read" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Read
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, email, target mentor, topic, or message contents..."
                className="pl-10 pr-9 h-10 text-xs rounded-xl bg-background/50 border-border/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Messages List Area */}
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground italic text-xs">Fetching messages from database...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-dashed border-border/60 bg-muted/10 p-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <h4 className="text-base font-bold text-foreground">No Messages Found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                  ? "No messages match your active filters or search terms."
                  : "Your message center is currently clear. Incoming submissions will appear here."}
              </p>
              {(searchQuery || categoryFilter !== "all" || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                  className="mt-4 text-xs font-semibold"
                >
                  Reset All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((m) => (
                <Card
                  key={m.id}
                  className={`rounded-3xl border transition-all shadow-elev ${
                    m.status === "new"
                      ? "bg-primary/5 border-primary/30"
                      : "bg-card/25 border-border/60 hover:bg-card/35"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Requester Identity */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center ${
                            m.isMentorshipInquiry
                              ? "bg-primary/20 text-primary border border-primary/30"
                              : m.status === "new"
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {m.isMentorshipInquiry ? (
                            <GraduationCap className="h-5 w-5" />
                          ) : m.status === "new" ? (
                            <Mail className="h-5 w-5" />
                          ) : (
                            <MessageSquare className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-base text-foreground leading-snug truncate">
                              {m.name}
                            </span>

                            {/* Classification Badges */}
                            {m.isMentorshipInquiry ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-mono px-2 py-0.5 bg-primary/15 text-primary border border-primary/25"
                              >
                                Mentorship Inquiry
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono px-2 py-0.5 text-muted-foreground"
                              >
                                General Contact
                              </Badge>
                            )}

                            {m.status === "new" && (
                              <Badge variant="default" className="text-[9px] font-mono h-4 px-1.5 bg-primary text-primary-foreground">
                                NEW
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            <a
                              href={`mailto:${m.email}`}
                              className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              {m.email}
                            </a>

                            {m.phone && (
                              <a
                                href={`tel:${m.phone}`}
                                className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                {m.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(m.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Inquiry Details Banner for Mentorship Requests */}
                    {m.isMentorshipInquiry && (
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-primary/15">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground">Target Mentor:</span>
                            <strong className="text-foreground text-sm">{m.targetMentor || "Not specified"}</strong>
                          </div>

                          {m.topic && (
                            <Badge variant="outline" className="text-[11px] font-mono border-primary/30 text-primary">
                              Topic: {m.topic}
                            </Badge>
                          )}
                        </div>

                        {m.requesterStatus && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <UserCheck className="h-3 w-3 text-primary" />
                            <span>Requester Account: {m.requesterStatus}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subject */}
                    {!m.isMentorshipInquiry && (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-primary mb-0.5">Subject</div>
                        <div className="font-semibold text-sm text-foreground">{m.subject}</div>
                      </div>
                    )}

                    {/* Message Body */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                        {m.isMentorshipInquiry ? "Mentorship Goals & Background" : "Message"}
                      </div>
                      <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap bg-background/40 p-3.5 rounded-xl border border-border/40">
                        {m.cleanMessage}
                      </p>
                    </div>

                    {/* Action Toolbar */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/40">
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => handleReply(m)}
                        className="text-xs font-bold h-8 gap-1.5"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Reply via Email
                      </Button>

                      {m.status === "new" && (
                        <Button
                          variant="soft"
                          size="sm"
                          onClick={() => markAsRead(m.id)}
                          disabled={busy}
                          className="text-xs font-semibold h-8 gap-1.5"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark as Read
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 ml-auto"
                        onClick={() => deleteMessage(m.id)}
                        disabled={busy}
                        title="Delete message"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card className="rounded-3xl border border-border/60 bg-card/25 shadow-elev">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Update the contact details shown on the website.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="support@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+880..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                      placeholder="123 Street..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Business Hours</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      value={contactHours}
                      onChange={(e) => setContactHours(e.target.value)}
                      placeholder="Mon - Fri: 9am - 6pm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="hero" onClick={saveSettings} disabled={busy || loadingSettings}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
