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

      // If email confirmation is required by Supabase, data.session is null
      if (!data.session) {
        toast({
          title: "Verify your email",
          description: `We've sent a verification link to ${values.email}. Please check your inbox (and spam folder) to activate your account.`,
        });
        setMode("login");
        return;
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
      <main className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-7xl items-center justify-center px-4 py-2 sm:px-6 sm:py-4">
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card/25 shadow-elev sm:rounded-3xl">
          <div className="p-4 sm:p-6">
            <Link to="/" className="flex items-center justify-center gap-2 min-h-[52px] transition-opacity hover:opacity-80">
              {isLogoLoading ? (
                <div className="h-12 w-32" />
              ) : logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-12 sm:h-14 object-contain"
                  loading="eager"
                  // @ts-ignore
                  fetchPriority="high"
                />
              ) : (
                <>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-brand shadow-glow">
                    <span className="text-xs font-black tracking-tight text-primary-foreground">IM</span>
                  </div>
                  <div className="text-sm font-semibold tracking-tight">
                    Industry<span className="text-primary">Mentor</span>
                  </div>
                </>
              )}
            </Link>

            <h1 className="mt-2 text-center text-xl font-black tracking-tight sm:mt-3 sm:text-2xl">
              {mode === "login" ? "Sign In" : mode === "reset" ? "Reset Password" : "Create Account"}
            </h1>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              {mode === "login"
                ? "Sign in to continue your learning journey."
                : mode === "reset"
                  ? "Enter your email and we’ll send you a reset link."
                  : "Create your account to access the dashboard and mentorship."}
            </p>

            {mode !== "reset" && (
              <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl border border-border/60 bg-background/20 p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={
                    mode === "login"
                      ? "rounded-lg bg-background/40 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm"
                      : "rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  }
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={
                    mode === "signup"
                      ? "rounded-lg bg-background/40 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm"
                      : "rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  }
                >
                  Create Account
                </button>
              </div>
            )}

            <div className="mt-3 h-px w-full bg-border/60" />

            {mode === "signup" ? (
              <form className="mt-3 space-y-2.5" onSubmit={signupForm.handleSubmit(onSignup)}>
                {/* 2-Column Grid for Name and Phone */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-background/30 px-3 py-1.5 shadow-inner transition-all focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/40">
                    <Label htmlFor="fullName" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Full Name
                    </Label>
                    <input
                      id="fullName"
                      placeholder="Enter full name"
                      autoComplete="name"
                      className="w-full bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
                      {...signupForm.register("fullName")}
                    />
                    {signupForm.formState.errors.fullName && (
                      <p className="text-[10px] text-destructive">{signupForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-border/70 bg-background/30 px-3 py-1.5 shadow-inner transition-all focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/40">
                    <Label htmlFor="phone" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Phone Number
                    </Label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      autoComplete="tel"
                      className="w-full bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
                      {...signupForm.register("phone")}
                    />
                    {signupForm.formState.errors.phone && (
                      <p className="text-[10px] text-destructive">{signupForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {/* Full Width Email Field */}
                <div className="rounded-xl border border-border/70 bg-background/30 px-3 py-1.5 shadow-inner transition-all focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/40">
                  <Label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Email Address
                  </Label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    autoComplete="email"
                    className="w-full bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
                    {...signupForm.register("email")}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-[10px] text-destructive">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>

                {/* 2-Column Grid for Passwords */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="relative rounded-xl border border-border/70 bg-background/30 px-3 py-1.5 shadow-inner transition-all focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/40">
                    <Label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Password
                    </Label>
                    <div className="flex items-center">
                      <input
                        id="password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Create password"
                        autoComplete="new-password"
                        className="w-full bg-transparent pr-6 text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
                        {...signupForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((v) => !v)}
                        aria-label={showSignupPassword ? "Hide password" : "Show password"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showSignupPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {signupForm.formState.errors.password && (
                      <p className="text-[10px] text-destructive">{signupForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="relative rounded-xl border border-border/70 bg-background/30 px-3 py-1.5 shadow-inner transition-all focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/40">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="confirmPassword" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Confirm
                      </Label>
                      <span
                        className={
                          !signupConfirmPassword
                            ? "text-[9px] text-muted-foreground"
                            : passwordsMatch
                              ? "text-[9px] font-medium text-emerald-400"
                              : "text-[9px] font-medium text-destructive"
                        }
                      >
                        {!signupConfirmPassword ? "" : passwordsMatch ? "Matched" : "Mismatch"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="confirmPassword"
                        type={showSignupConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        autoComplete="new-password"
                        className="w-full bg-transparent pr-6 text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
                        {...signupForm.register("confirmPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupConfirmPassword((v) => !v)}
                        aria-label={showSignupConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showSignupConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {signupForm.formState.errors.confirmPassword && (
                      <p className="text-[10px] text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <Button className="h-9 w-full text-xs font-semibold shadow-md" variant="hero" disabled={busy}>
                  {busy ? "Creating…" : "Create Account"}
                </Button>

                <p className="text-center text-[10px] text-muted-foreground leading-tight">
                  By registering, you agree to our{" "}
                  <Link to="/terms-of-service" className="text-primary underline-offset-4 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy-policy" className="text-primary underline-offset-4 hover:underline">
                    Privacy Policy
                  </Link>.
                </p>

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline font-medium"
                    onClick={() => setMode("login")}
                  >
                    Sign In
                  </button>
                </p>
              </form>
            ) : mode === "reset" ? (
              <form className="mt-3 space-y-3" onSubmit={resetForm.handleSubmit(onReset)}>
                <div className="rounded-xl border border-border/70 bg-background/30 px-3 py-1.5 shadow-inner transition-all focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/40">
                  <Label htmlFor="resetEmail" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Email Address
                  </Label>
                  <input
                    id="resetEmail"
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="w-full bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
                    {...resetForm.register("email")}
                  />
                  {resetForm.formState.errors.email && (
                    <p className="text-[10px] text-destructive">{resetForm.formState.errors.email.message}</p>
                  )}
                </div>
                <Button className="h-9 w-full text-xs font-semibold shadow-md" variant="hero" disabled={busy}>
                  {busy ? "Sending…" : "Send reset link"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
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
              <form className="mt-3 space-y-3" onSubmit={loginForm.handleSubmit(onLogin)}>
                <div className="rounded-xl border border-border/70 bg-background/30 px-3 py-1.5 shadow-inner transition-all focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/40">
                  <Label htmlFor="loginIdentifier" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Email or Phone Number
                  </Label>
                  <input
                    id="loginIdentifier"
                    placeholder="Enter your email or phone"
                    autoComplete="username"
                    className="w-full bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
                    {...loginForm.register("identifier")}
                  />
                  {loginForm.formState.errors.identifier && (
                    <p className="text-[10px] text-destructive">{loginForm.formState.errors.identifier.message}</p>
                  )}
                </div>

                <div className="relative rounded-xl border border-border/70 bg-background/30 px-3 py-1.5 shadow-inner transition-all focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/40">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="loginPassword" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Password
                    </Label>
                    <button
                      type="button"
                      className="text-[10px] text-primary underline-offset-4 hover:underline"
                      onClick={() => setMode("reset")}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="loginPassword"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full bg-transparent pr-6 text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
                      {...loginForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showLoginPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-[10px] text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button className="h-9 w-full text-xs font-semibold shadow-md" variant="hero" disabled={busy}>
                  {busy ? "Signing in…" : "Sign In"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline font-medium"
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
