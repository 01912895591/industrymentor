import { AmbientSpotlight } from "@/components/AmbientSpotlight";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useLogo } from "@/hooks/useLogo";
import { SEOHead } from "@/components/seo/SEOHead";

const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(255),
  password: z.string().min(1).max(72),
});

const resetSchema = z.object({
  email: z.string().trim().email().max(255),
});

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(5).max(20),
    email: z.string().trim().email().max(255),
    password: z.string().min(1).max(72),
    confirmPassword: z.string().min(1).max(72),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type ResetValues = z.infer<typeof resetSchema>;
type SignupValues = z.infer<typeof signupSchema>;

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [busy, setBusy] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { logoUrl, isLoading: isLogoLoading } = useLogo();

  const redirectTo = useMemo(() => {
    const rawFrom = (location.state as any)?.from as string | undefined;
    // Security hardening: ensure internal relative path only; reject protocol-relative (//) and backslash (\\)
    const from = (rawFrom && rawFrom.startsWith("/") && !rawFrom.startsWith("//") && !rawFrom.includes("\\"))
      ? rawFrom
      : "/";
    const search = location.search.replace(/^\?mode=[^&]*&?/, "?");
    return search && search !== "?" ? `${from}${search}` : from;
  }, [location.state, location.search]);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  });

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", phone: "", email: "", password: "", confirmPassword: "" },
  });

  const signupPassword = signupForm.watch("password") ?? "";
  const signupConfirmPassword = signupForm.watch("confirmPassword") ?? "";

  const passwordsMatch = useMemo(() => {
    if (!signupConfirmPassword) return false;
    return signupPassword === signupConfirmPassword;
  }, [signupPassword, signupConfirmPassword]);

  useEffect(() => {
    const requestedMode = new URLSearchParams(location.search).get("mode");
    if (requestedMode === "login" || requestedMode === "signup" || requestedMode === "reset") {
      setMode(requestedMode);
    }

    if (loading) return;
    if (user) {
      const checkAdminAndRedirect = async () => {
        const { data: adminFlag } = await (supabase as any).rpc("has_role", {
          _user_id: user?.id,
          _role: "admin",
        });
        navigate(adminFlag ? "/admin" : redirectTo, { replace: true });
      };

      void checkAdminAndRedirect();
    }
  }, [location.search, loading, user, navigate, redirectTo]);

  const onLogin = async (values: LoginValues) => {
    setBusy(true);
    try {
      let email = values.identifier;

      // If it doesn't look like an email, assume it's a phone number and look up the associated email
      if (!email.includes("@")) {
        const { data: profile, error: profileError } = await (supabase as any)
          .from("profiles")
          .select("user_id")
          .eq("phone", email.trim())
          .maybeSingle();

        if (profileError || !profile) {
          toast({
            title: "Login failed",
            description: "No account found with this phone number.",
            variant: "destructive",
          });
          return;
        }

        const { data: profileWithEmail, error: emailError } = await (supabase as any)
          .from("profiles")
          .select("email")
          .eq("user_id", profile.user_id)
          .maybeSingle();

        if (emailError || !profileWithEmail?.email) {
          toast({
            title: "Login failed",
            description: "Could not retrieve email for this phone number.",
            variant: "destructive",
          });
          return;
        }
        email = profileWithEmail.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: values.password,
      });
      if (error) {
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
        return;
      }
      const { data: adminFlag } = await (supabase as any).rpc("has_role", {
        _user_id: data.user?.id,
        _role: "admin",
      });
      toast({ title: "Welcome back", description: "Signed in successfully." });
      navigate(adminFlag ? "/admin" : redirectTo, { replace: true });
    } finally {
      setBusy(false);
    }
  };

  const onReset = async (values: ResetValues) => {
    setBusy(true);
    try {
      const resetRedirectUrl = import.meta.env.VITE_SITE_URL
        ? `${import.meta.env.VITE_SITE_URL}/reset-password`
        : `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: resetRedirectUrl,
      });
      if (error) {
        toast({ title: "Reset email failed", description: error.message, variant: "destructive" });
        return;
      }
      toast({
        title: "Check your email",
        description: "We sent a password reset link. Open it to set a new password.",
      });
      setMode("login");
    } finally {
      setBusy(false);
    }
  };

  const onSignup = async (values: SignupValues) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
        return;
      }

      const userId = data.user?.id;
      if (userId) {
        await (supabase as any)
          .from("profiles")
          .upsert(
            {
              user_id: userId,
              full_name: values.fullName,
              phone: values.phone,
              email: values.email, // Store email here to allow phone -> email lookup
            },
            { onConflict: "user_id" }
          );
      }

      const { data: adminFlag } = await (supabase as any).rpc("has_role", {
        _user_id: data.user?.id,
        _role: "admin",
      });

      toast({ title: "Account created", description: "You're signed in. Welcome!" });
      navigate(adminFlag ? "/admin" : redirectTo, { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AmbientSpotlight>
      <SEOHead title="Sign In & Register | IndustryMentor" noindex={true} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card/25 shadow-elev sm:rounded-3xl">
          <div className="p-5 sm:p-8">
            <Link to="/" className="flex items-center justify-center gap-3 min-h-[96px] transition-opacity hover:opacity-80">
              {isLogoLoading ? (
                <div className="h-24 w-40" />
              ) : logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-24 object-contain"
                  loading="eager"
                  // @ts-ignore
                  fetchPriority="high"
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
              )}
            </Link>

            <h1 className="mt-4 text-center text-2xl font-black tracking-tight sm:mt-6 sm:text-4xl">
              {mode === "login" ? "Sign In" : mode === "reset" ? "Reset Password" : "Create Account"}
            </h1>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {mode === "login"
                ? "Sign in to continue your learning journey."
                : mode === "reset"
                  ? "Enter your email and we’ll send you a reset link."
                  : "Create your account to access the dashboard and mentorship."}
            </p>

            {mode !== "reset" && (
              <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-background/20 p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={
                    mode === "login"
                      ? "rounded-xl bg-background/40 px-3 py-2 text-sm font-semibold text-foreground shadow-sm"
                      : "rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                  }
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={
                    mode === "signup"
                      ? "rounded-xl bg-background/40 px-3 py-2 text-sm font-semibold text-foreground shadow-sm"
                      : "rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                  }
                >
                  Create Account
                </button>
              </div>
            )}

            <div className="mt-6 h-px w-full bg-border/60" />

            {mode === "signup" ? (
              <form className="mt-8 space-y-5" onSubmit={signupForm.handleSubmit(onSignup)}>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" autoComplete="name" {...signupForm.register("fullName")} />
                  {signupForm.formState.errors.fullName && (
                    <p className="text-xs text-destructive">{signupForm.formState.errors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" autoComplete="tel" {...signupForm.register("phone")} />
                  {signupForm.formState.errors.phone && (
                    <p className="text-xs text-destructive">{signupForm.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" autoComplete="email" {...signupForm.register("email")} />
                  {signupForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showSignupPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-10"
                      {...signupForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((v) => !v)}
                      aria-label={showSignupPassword ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {signupForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showSignupConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-10"
                      {...signupForm.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirmPassword((v) => !v)}
                      aria-label={showSignupConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showSignupConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Match</span>
                    <span
                      className={
                        !signupConfirmPassword
                          ? "text-muted-foreground"
                          : passwordsMatch
                            ? "font-medium text-foreground"
                            : "font-medium text-destructive"
                      }
                    >
                      {!signupConfirmPassword ? "Type to confirm" : passwordsMatch ? "Passwords match" : "Doesn't match"}
                    </span>
                  </div>
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button className="w-full" variant="hero" disabled={busy}>
                  {busy ? "Creating…" : "Create Account"}
                </Button>

                <p className="text-center text-xs text-muted-foreground leading-relaxed">
                  By registering, you agree to our{" "}
                  <Link to="/terms-of-service" className="text-primary underline-offset-4 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy-policy" className="text-primary underline-offset-4 hover:underline">
                    Privacy Policy
                  </Link>.
                </p>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={() => setMode("login")}
                  >
                    Sign In
                  </button>
                </p>
              </form>
            ) : mode === "reset" ? (
              <form className="mt-8 space-y-5" onSubmit={resetForm.handleSubmit(onReset)}>
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email Address</Label>
                  <Input id="resetEmail" type="email" autoComplete="email" {...resetForm.register("email")} />
                  {resetForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{resetForm.formState.errors.email.message}</p>
                  )}
                </div>
                <Button className="w-full" variant="hero" disabled={busy}>
                  {busy ? "Sending…" : "Send reset link"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={() => setMode("login")}
                  >
                    Back to Sign In
                  </button>
                </p>
              </form>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={loginForm.handleSubmit(onLogin)}>
                <div className="space-y-2">
                  <Label htmlFor="loginIdentifier">Email or Phone Number</Label>
                  <Input
                    id="loginIdentifier"
                    placeholder="Enter your email or phone"
                    autoComplete="username"
                    {...loginForm.register("identifier")}
                  />
                  {loginForm.formState.errors.identifier && (
                    <p className="text-xs text-destructive">{loginForm.formState.errors.identifier.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="loginPassword">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-primary underline-offset-4 hover:underline"
                      onClick={() => setMode("reset")}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="loginPassword"
                      type={showLoginPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="pr-10"
                      {...loginForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button className="w-full" variant="hero" disabled={busy}>
                  {busy ? "Signing in…" : "Sign In"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={() => setMode("signup")}
                  >
                    Create one
                  </button>
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  <Link className="underline-offset-4 hover:underline" to="/">
                    Back to home
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </AmbientSpotlight>
  );
}
