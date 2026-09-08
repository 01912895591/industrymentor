import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Mail, Trash2, Loader2, MessageSquare, Clock, Settings, Save, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Message = {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'replied';
    created_at: string;
};

export function MessagesAdmin() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

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
                    if (s.key === "contact_address") setContactAddress(s.value);
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
            const { error } = await supabase
                .from("messages")
                .update({ status: 'read' })
                .eq("id", id);
            if (error) throw error;
            await loadMessages();
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

    const handleReply = (email: string, subject: string) => {
        window.location.href = `mailto:${email}?subject=Re: ${subject}`;
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
                // Upsert logic for site_settings
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

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Message Center</h2>
                    <p className="text-muted-foreground">Manage inquiries and contact details.</p>
                </div>
            </div>

            <Tabs defaultValue="inbox" className="space-y-6">
                <TabsList className="bg-card/50 p-1 rounded-xl border border-border/40">
                    <TabsTrigger value="inbox" className="rounded-lg gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Inbox
                        {messages.filter(m => m.status === 'new').length > 0 && (
                            <Badge variant="default" className="ml-1 h-5 px-1.5 text-[10px]">
                                {messages.filter(m => m.status === 'new').length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-lg gap-2">
                        <Settings className="h-4 w-4" />
                        Contact Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inbox" className="space-y-4">
                    <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={loadMessages} disabled={loading}>
                            {busy || loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Refresh Inbox
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                            <p className="mt-4 text-muted-foreground italic">Fetching messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-20 rounded-3xl border border-dashed bg-muted/20">
                            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground italic">No messages found.</p>
                        </div>
                    ) : (
                        messages.map((m) => (
                            <Card key={m.id} className={`rounded-3xl border border-border/60 shadow-elev transition-all ${m.status === 'new' ? 'bg-primary/5 border-primary/20' : 'bg-card/25'}`}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${m.status === 'new' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                {m.status === 'new' ? <Mail className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg flex items-center gap-2">
                                                    {m.name}
                                                    {m.status === 'new' && (
                                                        <Badge variant="default" className="text-[10px] h-4">NEW</Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <Mail className="h-3 w-3" />
                                                    {m.email}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(m.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Subject</div>
                                            <div className="font-semibold">{m.subject}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Message</div>
                                            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{m.message}</p>
                                        </div>

                                        <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                                            <Button variant="hero" size="sm" onClick={() => handleReply(m.email, m.subject)}>
                                                Reply via Email
                                            </Button>
                                            {m.status === 'new' && (
                                                <Button variant="soft" size="sm" onClick={() => markAsRead(m.id)}>
                                                    Mark as Read
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10 ml-auto" onClick={() => deleteMessage(m.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
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
                                        <Input className="pl-10" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="support@example.com" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-10" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+880..." />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-10" value={contactAddress} onChange={e => setContactAddress(e.target.value)} placeholder="123 Street..." />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Business Hours</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-10" value={contactHours} onChange={e => setContactHours(e.target.value)} placeholder="Mon - Fri: 9am - 6pm" />
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
