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
    address: "123 Learning Street, Education City",
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
          if (s.key === "contact_address") newInfo.address = s.value;
          if (s.key === "contact_hours") newInfo.hours = s.value;
        });
        setContactInfo(newInfo);
      }
    };
    fetchSettings();
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <header className="text-center">
        <h2 className="text-4xl font-black tracking-tight">
          Get in <span className="text-primary">Touch</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
          Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border/60 bg-card/25 p-7 shadow-elev">
          <div className="text-xl font-extrabold">Contact Information</div>

          <div className="mt-6 space-y-5">
            <div className="flex gap-3">
              <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-background/25">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">Email</div>
                <div className="text-sm text-muted-foreground">{contactInfo.email}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-background/25">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">Phone</div>
                <div className="text-sm text-muted-foreground">{contactInfo.phone}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-background/25">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">Address</div>
                <div className="text-sm text-muted-foreground">{contactInfo.address}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-background/25">
                <Timer className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">Business Hours</div>
                <div className="text-sm text-muted-foreground">{contactInfo.hours}</div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-3xl border border-border/60 bg-card/25 p-7 shadow-elev">
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

            <Button variant="hero" className="w-full">
              Send Message
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
