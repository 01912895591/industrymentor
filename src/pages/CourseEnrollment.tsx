import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, CheckCircle2, ShieldCheck, ArrowLeft, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

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

    const handleConfirmPayment = async () => {
        console.log("Starting payment confirmation...");
        if (!user) {
            console.error("User not found");
            toast.error("Please sign in to continue");
            return;
        }
        if (!course) {
            console.error("Course not found");
            toast.error("Course data missing");
            return;
        }

        setProcessing(true);
        try {
            console.log("Creating purchase record...", {
                user_id: user.id,
                title: course.title,
                amount_cents: course.price_cents
            });

            // 1. Create Purchase Record
            const { data: purchase, error: purchaseError } = await (supabase as any)
                .from("purchases")
                .insert({
                    user_id: user.id,
                    title: course.title,
                    item_type: "course",
                    item_key: course.id,
                    amount_cents: course.price_cents
                })
                .select()
                .single();

            if (purchaseError) {
                console.error("Purchase creation failed:", purchaseError);
                throw new Error(`Purchase Error: ${purchaseError.message} (${purchaseError.code})`);
            }

            console.log("Purchase created:", purchase);

            // 2. Create Enrollment Record
            const { error: enrollmentError } = await (supabase as any)
                .from("course_enrollments")
                .insert({
                    user_id: user.id,
                    course_id: course.id,
                    purchase_id: purchase.id
                });

            if (enrollmentError) {
                console.error("Enrollment creation failed:", enrollmentError);
                throw new Error(`Enrollment Error: ${enrollmentError.message} (${enrollmentError.code})`);
            }

            console.log("Enrollment success!");
            toast.success("Enrollment successful!");
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

    return (
        <div className="min-h-screen bg-background/50 pb-20 pt-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">

                {/* Header / Breadcrumb */}
                <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
                    <Link to="/" className="hover:text-foreground">Home</Link>
                    <span>/</span>
                    <Link to="/#courses" className="hover:text-foreground">Courses</Link>
                    <span>/</span>
                    <span className="text-foreground font-medium truncate max-w-[200px]">{course.title}</span>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left Column: Course Details */}
                    <div className="lg:col-span-2 space-y-8 animate-fade-in text-left">

                        {/* Course Overview */}
                        <div>
                            <h1 className="text-2xl xs:text-3xl font-black tracking-tight sm:text-4xl mb-4 leading-tight">{course.title}</h1>
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
                                                        <img src={course.cover_image_path} alt={course.title} className="h-full w-full object-cover" />
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
                                            <div className="space-y-4 animate-fade-in">
                                                <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                                                    <p className="font-medium mb-1">Payment Instructions:</p>
                                                    <p className="text-muted-foreground mb-2">Please send <strong>৳{(course.price_cents / 100).toLocaleString()}</strong> to the following number via Bkash/Nagad.</p>
                                                    <div className="space-y-1 font-mono text-xs">
                                                        <div className="flex justify-between">
                                                            <span>Bkash (Personal):</span>
                                                            <span className="font-bold select-all">01912895591</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Nagad (Personal):</span>
                                                            <span className="font-bold select-all">01912895591</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Transaction ID / Note</label>
                                                    <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. 8N7X..." />
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="flex flex-col gap-3">
                                        {enrollStep === "review" ? (
                                            <Button size="lg" className="w-full font-bold" onClick={handleProceedToPayment}>
                                                Proceed to Checkout
                                            </Button>
                                        ) : (
                                            <div className="w-full space-y-2">
                                                <Button size="lg" className="w-full font-bold" onClick={handleConfirmPayment} disabled={processing}>
                                                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                                                    Confirm Payment
                                                </Button>
                                                <Button variant="ghost" className="w-full" onClick={handleBackToReview} disabled={processing}>
                                                    Back to Review
                                                </Button>
                                            </div>
                                        )}
                                        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                                            <ShieldCheck className="h-3 w-3" /> Secure Payment
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
