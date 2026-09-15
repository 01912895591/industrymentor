import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const DEMO_PASSWORD = "DemoPass123!";

async function signInOrCreate(email: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
  if (!error) return;

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password: DEMO_PASSWORD,
    options: { emailRedirectTo: `${window.location.origin}/` },
  });

  if (signUpError) throw signUpError;

  const { error: secondSignInError } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
  if (secondSignInError) throw secondSignInError;
}

export function DemoAccessCard(props: { redirectTo: string; onAuthed: () => void }) {
  const { redirectTo, onAuthed } = props;

  const handleStudent = async () => {
    try {
      await signInOrCreate("student@demo.com");
      toast({ title: "Demo student signed in", description: `Redirecting to ${redirectTo}` });
      onAuthed();
    } catch (e: any) {
      toast({ title: "Demo login failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  const handleAdmin = async () => {
    try {
      await signInOrCreate("admin@demo.com");

      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (userId) {
        // Bootstrap: first admin can be created once.
        const { error } = await (supabase as any).from("user_roles").insert({ user_id: userId, role: "admin" });
        if (error && String(error.code) !== "23505") {
          // 23505 = already has role
          // if bootstrap already used, show a friendly message
          toast({
            title: "Admin role not granted",
            description: error.message,
            variant: "destructive",
          });
        }
      }

      toast({ title: "Demo admin signed in", description: "Open the Admin Panel from the top menu." });
      onAuthed();
    } catch (e: any) {
      toast({ title: "Demo admin login failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-border/60 bg-card/25 p-5 shadow-sm">
      <div className="text-sm font-bold">Demo access</div>
      <p className="mt-1 text-xs text-muted-foreground">
        Student: <span className="font-semibold">student@demo.com</span> • Password: <span className="font-semibold">{DEMO_PASSWORD}</span>
        <br />
        Admin: <span className="font-semibold">admin@demo.com</span> • Password: <span className="font-semibold">{DEMO_PASSWORD}</span>
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button variant="soft" onClick={() => void handleStudent()}>
          Demo Student Login
        </Button>
        <Button variant="hero" onClick={() => void handleAdmin()}>
          Demo Admin Login
        </Button>
      </div>
    </div>
  );
}
