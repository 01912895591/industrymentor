import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MapPin, Phone, Timer, Send, MessageSquare } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().email("Valid email is required").max(255),
  subject: z.string().trim().min(2, "Subject is required").max(120),
  message: z.string().trim().min(10, "Message must be at least 10 chars").max(1000),
});

type Values = z.infer<typeof schema>;

export function ContactSection() {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = async (values: Values) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("messages").insert([values as any]);
      if (error) throw error;

      // Dispatch Telegram Instant Notification via Cloudflare Pages Function
      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }).catch((err) => console.error("Server-side Telegram notification failed:", err));

      toast({ title: "Message sent!", description: "Thanks for reaching out. We'll respond shortly." });
      form.reset();
    } catch (e: any) {
      toast({ title: "Failed to send message", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const [contactInfo, setContactInfo] = useState({
    email: "hi@industrymentor.com",
    phone: "+8801912895591",
    address: "25/2, Salimuddin Market Road, Mirpur-1, Dhaka, Bangladesh",
    hours: "Sat – Thu: 10:00 am to 10:00 pm",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("site_settings" as any)
        .select("*")
        .in("key", ["contact_email", "contact_phone", "contact_address", "contact_hours"]);

      if (data) {
        const newInfo = { ...contactInfo };
        data.forEach((s: any) => {
          if (s.key === "contact_email") newInfo.email = s.value;
          if (s.key === "contact_phone") newInfo.phone = s.value;
          if (s.key === "contact_address") {
            let addr = s.value;
            if (addr) {
              addr = addr.replace(/Bandladesh/gi, "Bangladesh")
                         .replace(/^25\/2\s*\.?\s*salimuddin market road,\s*mirpur-1,\s*dhaka,\s*bangladesh/i, "25/2, Salimuddin Market Road, Mirpur-1, Dhaka, Bangladesh");
            }
            newInfo.address = addr || "25/2, Salimuddin Market Road, Mirpur-1, Dhaka, Bangladesh";
          }
          if (s.key === "contact_hours") newInfo.hours = s.value;
        });
        setContactInfo(newInfo);
      }
    };
    fetchSettings();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:py-8 lg:py-10">
      <header className="text-center mb-5 sm:mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          <MessageSquare className="h-3 w-3" /> Quick Support & Inquiries
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Get in <span className="text-primary">Touch</span>
        </h2>
        <p className="mx-auto mt-1 max-w-lg text-xs sm:text-sm text-muted-foreground">
          Have questions? Send us a message and our team will get back to you promptly.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-12 items-stretch">
        {/* Left Column: Contact Details Card */}
        <div className="lg:col-span-5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xl p-5 sm:p-6 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              Contact Information
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-5">
              Direct channels to reach our support & admissions.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-primary/10 border border-primary/20 shrink-0 text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">Email</div>
                  <a href={`mailto:${contactInfo.email}`} className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block">
                    {contactInfo.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-primary/10 border border-primary/20 shrink-0 text-primary">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">Phone / WhatsApp</div>
                  <a href={`tel:${contactInfo.phone}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    {contactInfo.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-primary/10 border border-primary/20 shrink-0 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">Address</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{contactInfo.address}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-primary/10 border border-primary/20 shrink-0 text-primary">
                  <Timer className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">Business Hours</div>
                  <div className="text-xs text-muted-foreground">{contactInfo.hours}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50 text-[11px] text-muted-foreground/80 flex items-center justify-between">
            <span>Response time: &lt; 2 hours</span>
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Support Online" />
          </div>
        </div>

        {/* Right Column: Sleek Compact Form */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="lg:col-span-7 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xl p-5 sm:p-6 shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            {/* Name + Email side by side on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="contactName" className="text-xs font-semibold">
                  Your Name
                </Label>
                <Input
                  id="contactName"
                  placeholder="John Doe"
                  className="h-9 text-xs"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="contactEmail" className="text-xs font-semibold">
                  Email Address
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="john@example.com"
                  className="h-9 text-xs"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="contactSubject" className="text-xs font-semibold">
                Subject
              </Label>
              <Input
                id="contactSubject"
                placeholder="How can we help?"
                className="h-9 text-xs"
                {...form.register("subject")}
              />
              {form.formState.errors.subject && (
                <p className="text-[11px] text-destructive">{form.formState.errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="contactMessage" className="text-xs font-semibold">
                Message
              </Label>
              <Textarea
                id="contactMessage"
                rows={3}
                placeholder="Tell us more about your inquiry..."
                className="text-xs resize-none min-h-[80px]"
                {...form.register("message")}
              />
              {form.formState.errors.message && (
                <p className="text-[11px] text-destructive">{form.formState.errors.message.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            variant="hero"
            className="w-full mt-4 font-bold text-xs h-10 shadow-md group"
          >
            {submitting ? "Sending..." : "Send Message"}
            <Send className="ml-2 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </form>
      </div>
    </section>
  );
}
