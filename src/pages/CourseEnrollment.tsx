import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, CheckCircle2, ShieldCheck, ArrowLeft, CreditCard, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCourseTitle } from "@/lib/formatTitle";

type Course = {
    id: string;
    title: string;
    description: string | null;
    price_cents: number;
    cover_image_path: string | null;
};

type Module = {
    id: string;
    title: string;
    description: string | null;
    price_cents: number;
};

const paymentFormSchema = z.object({
    paymentMethod: z.enum(["bkash", "nagad", "bank"], {
        required_error: "Please select a payment method",
    }),
    senderPhone: z
        .string()
        .trim()
        .min(11, "Sender mobile number must be at least 11 digits")
        .max(16, "Sender mobile number is too long")
        .regex(/^[0-9+\s-]+$/, "Please enter a valid phone number"),
    transactionId: z
        .string()
        .trim()
        .min(4, "Transaction ID must be at least 4 characters")
        .max(40, "Transaction ID is too long")
        .regex(/^[a-zA-Z0-9_-]+$/, "Transaction ID contains invalid characters"),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function CourseEnrollment() {
    const { courseId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrollStep, setEnrollStep] = useState<"review" | "payment" | "confirm">("payment");
    const [processing, setProcessing] = useState(false);
    const checkoutRef = useRef<HTMLDivElement>(null);

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentFormSchema),
        defaultValues: {
            paymentMethod: "bkash",
            senderPhone: "",
            transactionId: "",
        },
    });

    useEffect(() => {
        if (!loading && course && enrollStep === "payment") {
            const timer = setTimeout(() => {
                if (window.innerWidth < 1024) { // Only scroll on mobile/tablet (below lg breakpoint)
                    checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }, 300); // Wait for content to render
            return () => clearTimeout(timer);
        }
    }, [loading, course, enrollStep]);

    useEffect(() => {
        if (courseId) {
            loadCourseData();
        }
    }, [courseId]);

    const loadCourseData = async () => {
        setLoading(true);
        try {
            // Fetch Course
            const { data: courseData, error: courseError } = await (supabase
                .from("courses")
                .select("*")
                .eq("id", courseId)
                .single()) as any;

            if (courseError) throw courseError;
            setCourse(courseData);

            // Fetch Modules
            const { data: modulesData, error: modulesError } = await (supabase
                .from("course_modules" as any)
                .select("*")
                .eq("course_id", courseId)
                .order("created_at", { ascending: true })) as any;

            if (modulesError) throw modulesError;
            setModules(modulesData || []);

        } catch (error) {
            console.error("Error loading enrollment data:", error);
            toast.error("Failed to load course details");
        } finally {
            setLoading(false);
        }
    };

    const handleProceedToPayment = () => {
        setEnrollStep("payment");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToReview = () => {
        setEnrollStep("review");
    };

    const onSubmitPayment = async (values: PaymentFormValues) => {
        if (processing) return;

        if (!user) {
            toast.error("Please sign in to continue");
            navigate("/auth", { state: { from: `/enroll/${courseId}` } });
            return;
        }
        if (!course) {
            toast.error("Course data missing");
            return;
        }

        setProcessing(true);
        try {
            const trimmedTxId = values.transactionId.trim().toUpperCase();
            const trimmedPhone = values.senderPhone.trim();

            // 1. Duplicate enrollment check:
            const { data: existingEnrollment } = await (supabase as any)
                .from("course_enrollments")
                .select("id, status")
                .eq("user_id", user.id)
                .eq("course_id", course.id)
                .maybeSingle();

            if (existingEnrollment) {
                if (existingEnrollment.status === "active") {
                    toast.info("You are already enrolled in this course!");
                    navigate("/dashboard");
                    return;
                }
                if (existingEnrollment.status === "pending") {
                    toast.warning("You already have a pending verification for this course.");
                    setEnrollStep("confirm");
                    return;
                }
            }

            // 2. Create or verify Purchase Record
            let purchaseId: string | null = null;
            const { data: purchase, error: purchaseError } = await (supabase as any)
                .from("purchases")
                .insert({
                    user_id: user.id,
                    title: course.title,
                    item_type: "course",
                    item_key: course.id,
                    amount_cents: course.price_cents,
                    payment_method: values.paymentMethod,
                    transaction_id: trimmedTxId,
                    status: "pending",
                })
                .select()
                .maybeSingle();

            if (purchaseError) {
                // If unique constraint hit, fetch existing purchase
                if (purchaseError.code === "23505") {
                    const { data: existingPurchase } = await (supabase as any)
                        .from("purchases")
                        .select("id")
                        .eq("user_id", user.id)
                        .eq("item_type", "course")
                        .eq("item_key", course.id)
                        .maybeSingle();
                    purchaseId = existingPurchase?.id || null;
                } else {
                    console.error("Purchase creation error:", purchaseError);
                    throw new Error("Unable to log payment record. Please try again.");
                }
            } else if (purchase) {
                purchaseId = purchase.id;
            }

            // 3. Create Enrollment Record
            const { error: enrollmentError } = await (supabase as any)
                .from("course_enrollments")
                .insert({
                    user_id: user.id,
                    course_id: course.id,
                    purchase_id: purchaseId,
                    payment_method: values.paymentMethod,
                    transaction_id: trimmedTxId,
                    sender_phone: trimmedPhone,
                    status: "pending",
                    completed: false,
                });

            if (enrollmentError) {
                if (enrollmentError.code === "23505") {
                    toast.info("Your enrollment request was already logged.");
                    setEnrollStep("confirm");
                    return;
                }
                console.error("Enrollment error:", enrollmentError);
                throw new Error("Failed to process enrollment submission.");
            }

            toast.success("Enrollment request submitted! Verification in progress.");
            setEnrollStep("confirm");
        } catch (error: any) {
            console.error("Transaction failed:", error);
            toast.error(error.message || "Failed to process enrollment");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold">Course Not Found</h2>
                <Button asChild variant="default">
                    <Link to="/#courses">Back to Courses</Link>
                </Button>
            </div>
        );
    }

    const displayTitle = formatCourseTitle(course.title);

    return (
        <div className="min-h-screen bg-background/50 pb-20 pt-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">

                {/* Header / Breadcrumb */}
                <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
                    <Link to="/" className="hover:text-foreground">Home</Link>
                    <span>/</span>
                    <Link to="/#courses" className="hover:text-foreground">Courses</Link>
                    <span>/</span>
                    <span className="text-foreground font-medium truncate max-w-[200px]">{displayTitle}</span>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left Column: Course Details */}
                    <div className="lg:col-span-2 space-y-8 animate-fade-in text-left">

                        {/* Course Overview */}
                        <div>
                            <h1 className="text-2xl xs:text-3xl font-black tracking-tight sm:text-4xl mb-4 leading-tight">{displayTitle}</h1>
                            <p className="text-base xs:text-lg text-muted-foreground leading-relaxed">
                                {course.description || "No description available for this course."}
                            </p>
                        </div>

                        {/* Modules List */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    What You'll Learn
                                </CardTitle>
                                <CardDescription>
                                    This course includes {modules.length} comprehensive modules.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {modules.length > 0 ? (
                                    <Accordion type="single" collapsible className="w-full">
                                        {modules.map((mod, index) => (
                                            <AccordionItem key={mod.id} value={mod.id}>
                                                <AccordionTrigger className="hover:no-underline">
                                                    <div className="flex gap-3 text-left">
                                                        <span className="text-muted-foreground font-mono text-sm pt-0.5">
                                                            Module {index + 1}
                                                        </span>
                                                        <span className="font-medium">{mod.title}</span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="text-muted-foreground pl-16">
                                                    {mod.description || "No specific description for this module."}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Modules are being updated.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Benefits / Trust */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="rounded-xl bg-card p-4 border shadow-sm">
                                <ShieldCheck className="h-8 w-8 text-primary mb-3" />
                                <h3 className="font-bold">Lifetime Access</h3>
                                <p className="text-sm text-muted-foreground mt-1">Get unlimited access to course materials and future updates.</p>
                            </div>
                            <div className="rounded-xl bg-card p-4 border shadow-sm">
                                <CheckCircle2 className="h-8 w-8 text-primary mb-3" />
                                <h3 className="font-bold">Certificate of Completion</h3>
                                <p className="text-sm text-muted-foreground mt-1">Earn a verified certificate to showcase your skills.</p>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Checkout / Payment - Sticky */}
                    <div className="lg:col-span-1" ref={checkoutRef}>
                        <div className="sticky top-24 space-y-4">

                            {enrollStep === "confirm" ? (
                                <Card className="border-primary/20 bg-primary/5">
                                    <CardContent className="pt-6 text-center space-y-4">
                                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/20 text-primary">
                                            <CheckCircle2 className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-primary">Enrollment submitted!</h3>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                We have received your enrollment request. You will be notified once access is granted.
                                            </p>
                                        </div>
                                        <Button asChild className="w-full" size="lg">
                                            <Link to="/dashboard">Go to Dashboard</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="shadow-lg border-primary/20 overflow-hidden">
                                    <div className="h-2 bg-gradient-brand" />
                                    <CardHeader>
                                        <CardTitle>{enrollStep === "payment" ? "Secure Checkout" : "Course Summary"}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {enrollStep === "review" && (
                                            <>
                                                <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                                                    {course.cover_image_path ? (
                                                        <img src={course.cover_image_path} alt={displayTitle} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No Cover Image</div>
                                                    )}
                                                </div>
                                                <Separator />
                                                <div className="flex justify-between items-center text-lg font-bold">
                                                    <span>Total Price</span>
                                                    <span>৳{(course.price_cents / 100).toLocaleString()}</span>
                                                </div>
                                            </>
                                        )}

                                        {enrollStep === "payment" && (
                                            <form onSubmit={form.handleSubmit(onSubmitPayment)} className="space-y-4 animate-fade-in" id="payment-form">
                                                {/* Payment Method Selector */}
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Payment Method</Label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => form.setValue("paymentMethod", "bkash")}
                                                            className={`flex items-center justify-center p-2.5 rounded-lg border text-xs font-bold transition-all ${
                                                                form.watch("paymentMethod") === "bkash"
                                                                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                                    : "border-border bg-card/50 text-muted-foreground hover:bg-muted/50"
                                                            }`}
                                                        >
                                                            bKash Personal
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => form.setValue("paymentMethod", "nagad")}
                                                            className={`flex items-center justify-center p-2.5 rounded-lg border text-xs font-bold transition-all ${
                                                                form.watch("paymentMethod") === "nagad"
                                                                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                                    : "border-border bg-card/50 text-muted-foreground hover:bg-muted/50"
                                                            }`}
                                                        >
                                                            Nagad Personal
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Payment Instructions Card */}
                                                <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-xs">Send Money To:</span>
                                                        <span className="font-bold text-xs font-mono select-all bg-background/80 px-2 py-0.5 rounded border">
                                                            01912895591
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                        <span>Payable Amount:</span>
                                                        <span className="font-bold text-foreground">৳{(course.price_cents / 100).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground leading-tight pt-1 border-t border-border/40">
                                                        Send the exact amount via "Send Money" to the personal number above, then enter your details below.
                                                    </p>
                                                </div>

                                                {/* Sender Mobile Number */}
                                                <div className="space-y-1.5 text-left">
                                                    <Label htmlFor="senderPhone" className="text-xs font-semibold">
                                                        Sender Mobile Number <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Input
                                                        id="senderPhone"
                                                        type="text"
                                                        placeholder="e.g. 01712345678"
                                                        className={form.formState.errors.senderPhone ? "border-destructive focus-visible:ring-destructive" : ""}
                                                        {...form.register("senderPhone")}
                                                        disabled={processing}
                                                    />
                                                    {form.formState.errors.senderPhone && (
                                                        <p className="text-xs text-destructive flex items-center gap-1 pt-0.5">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {form.formState.errors.senderPhone.message}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Transaction ID */}
                                                <div className="space-y-1.5 text-left">
                                                    <Label htmlFor="transactionId" className="text-xs font-semibold">
                                                        Transaction ID (TrxID) <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Input
                                                        id="transactionId"
                                                        type="text"
                                                        placeholder="e.g. 8N7X29MA"
                                                        className={form.formState.errors.transactionId ? "border-destructive focus-visible:ring-destructive font-mono uppercase" : "font-mono uppercase"}
                                                        {...form.register("transactionId")}
                                                        disabled={processing}
                                                    />
                                                    {form.formState.errors.transactionId && (
                                                        <p className="text-xs text-destructive flex items-center gap-1 pt-0.5">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {form.formState.errors.transactionId.message}
                                                        </p>
                                                    )}
                                                </div>
                                            </form>
                                        )}
                                    </CardContent>
                                    <CardFooter className="flex flex-col gap-3">
                                        {enrollStep === "review" ? (
                                            <Button size="lg" className="w-full font-bold" onClick={handleProceedToPayment}>
                                                Proceed to Checkout
                                            </Button>
                                        ) : (
                                            <div className="w-full space-y-2">
                                                <Button
                                                    size="lg"
                                                    className="w-full font-bold"
                                                    type="submit"
                                                    form="payment-form"
                                                    disabled={processing}
                                                >
                                                    {processing ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Submitting Payment...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CreditCard className="mr-2 h-4 w-4" />
                                                            Submit Payment
                                                        </>
                                                    )}
                                                </Button>
                                                <Button variant="ghost" className="w-full" onClick={handleBackToReview} disabled={processing} type="button">
                                                    Back to Review
                                                </Button>
                                            </div>
                                        )}
                                        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                                            <ShieldCheck className="h-3 w-3" /> Manual Verification within 1–2 hours
                                        </p>
                                    </CardFooter>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
