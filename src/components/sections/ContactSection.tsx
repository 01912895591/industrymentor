import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MapPin, Phone, Timer } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(1000),
});

type Values = z.infer<typeof schema>;

export function ContactSection() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = async (values: Values) => {
    try {
      const { error } = await supabase.from("messages").insert([values as any]);
      if (error) throw error;
      toast({ title: "Message sent", description: "Thanks! We'll get back to you shortly." });
      form.reset();
    } catch (e: any) {
      toast({ title: "Failed to send message", description: e.message, variant: "destructive" });
    }
  };

  const [contactInfo, setContactInfo] = useState({
    email: "support@industrymentor.example",
    phone: "+8801912895591",
    address: "25/2, Salimuddin Market Road, Mirpur-1, Dhaka, Bangladesh",
    hours: "Mon – Fri: 9:00 AM – 6:00 PM",
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
    <section className="mx-auto max-w-7xl px-4 py-20 lg:py-24 sm:px-6">
      <header className="text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Get in <span className="text-primary">Touch</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
          Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/40 p-7 shadow-sm">
          <div className="text-xl font-bold text-foreground">Contact Information</div>

          <div className="mt-6 space-y-5">
            <div className="flex gap-3">
              <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-surface-2/60 border border-border/50">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Email</div>
                <div className="text-sm text-muted-foreground">{contactInfo.email}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-surface-2/60 border border-border/50">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Phone</div>
                <div className="text-sm text-muted-foreground">{contactInfo.phone}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-surface-2/60 border border-border/50">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Address</div>
                <div className="text-sm text-muted-foreground">{contactInfo.address}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-surface-2/60 border border-border/50">
                <Timer className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Business Hours</div>
                <div className="text-sm text-muted-foreground">{contactInfo.hours}</div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-xl border border-border/70 bg-card/40 p-7 shadow-sm">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Your Name</Label>
              <Input id="contactName" placeholder="John Doe" {...form.register("name")} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email Address</Label>
              <Input id="contactEmail" type="email" placeholder="john@example.com" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactSubject">Subject</Label>
              <Input id="contactSubject" placeholder="How can we help?" {...form.register("subject")} />
              {form.formState.errors.subject && (
                <p className="text-xs text-destructive">{form.formState.errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactMessage">Message</Label>
              <Textarea id="contactMessage" rows={6} placeholder="Tell us more about your inquiry…" {...form.register("message")} />
              {form.formState.errors.message && (
                <p className="text-xs text-destructive">{form.formState.errors.message.message}</p>
              )}
            </div>

            <Button variant="default" className="w-full font-semibold">
              Send Message
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
