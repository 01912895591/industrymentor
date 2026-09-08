import { AmbientSpotlight } from "@/components/AmbientSpotlight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useLogo } from "@/hooks/useLogo";
import { Eye, EyeOff } from "lucide-react";

const schema = z
  .object({
    password: z.string().min(1).max(72),
    confirmPassword: z.string().min(1).max(72),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const { logoUrl, isLoading: isLogoLoading } = useLogo();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    // When arriving from the reset email, the auth client will exchange tokens and populate a session.
    let cancelled = false;
    supabase.auth.getSession().then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        toast({ title: "Reset link invalid", description: error.message, variant: "destructive" });
      }
      if (!data.session) {
        toast({
          title: "Reset link required",
          description: "Please use the password reset link from your email.",
          variant: "destructive",
        });
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (values: Values) => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        toast({ title: "Could not update password", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Password updated", description: "You can now continue." });
      toast({ title: "Password updated", description: "You can now continue." });

      const { data: adminFlag } = await (supabase as any).rpc("has_role", {
        _user_id: (await supabase.auth.getUser()).data.user?.id,
        _role: "admin",
      });
      navigate(adminFlag ? "/admin" : "/dashboard", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AmbientSpotlight>
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-md rounded-3xl border border-border/60 bg-card/25 p-6 shadow-elev sm:p-8">
          <div className="flex items-center justify-center gap-3 min-h-[96px]">
            <LogoSection />
          </div>

          <h1 className="text-center text-4xl font-black tracking-tight mt-6">Set New Password</h1>
          <p className="mt-3 text-center text-sm text-muted-foreground">Choose a new password for your account.</p>

          {!ready ? (
            <div className="mt-8 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="pr-10"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="pr-10"
                    {...form.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button className="w-full" variant="hero" disabled={busy}>
                {busy ? "Updating…" : "Update Password"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                <Link className="underline-offset-4 hover:underline" to="/auth">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </AmbientSpotlight>
  );
}

function LogoSection() {
  const { logoUrl, isLoading } = useLogo();
  const content = isLoading ? (
    <div className="h-24 w-40" />
  ) : logoUrl ? (
    <img
      src={logoUrl}
      alt="Logo"
      className="h-24 object-contain"
      loading="eager"
    />
  ) : (
    <>
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand shadow-glow">
        <span className="text-xs font-black tracking-tight text-primary-foreground">IM</span>
      </div>
      <div className="text-base font-semibold tracking-tight">
        Industry<span className="text-primary">Mentor</span>
      </div>
    </>
  );

  return (
    <Link to="/" className="flex items-center justify-center gap-3 transition-opacity hover:opacity-80">
      {content}
    </Link>
  );
}
