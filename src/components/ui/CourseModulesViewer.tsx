import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

type Module = {
    id: string;
    title: string;
    description: string | null;
    price_cents: number;
};

interface CourseModulesViewerProps {
    courseId: string;
    courseTitle: string;
}

export function CourseModulesViewer({ courseId, courseTitle }: CourseModulesViewerProps) {
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [markingComplete, setMarkingComplete] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            const loadModules = async () => {
                setLoading(true);
                try {
                    const { data: { user } } = await supabase.auth.getUser();

                    const [modulesRes, enrollRes] = await Promise.all([
                        supabase
                            .from("course_modules" as any)
                            .select("*")
                            .eq("course_id", courseId)
                            .order("created_at", { ascending: true }),
                        user ? supabase
                            .from("course_enrollments")
                            .select("completed")
                            .eq("course_id", courseId)
                            .eq("user_id", user.id)
                            .single() : Promise.resolve({ data: null, error: null })
                    ]);

                    if (modulesRes.data) {
                        setModules(modulesRes.data as any);
                    }
                    if (enrollRes.data) {
                        setIsEnrolled(true);
                        setIsCompleted(enrollRes.data.completed || false);
                    } else {
                        setIsEnrolled(false);
                    }
                } catch (error) {
                    console.error("Failed to load data", error);
                } finally {
                    setLoading(false);
                }
            };
            loadModules();
        }
    }, [open, courseId]);

    const handleMarkComplete = async () => {
        try {
            setMarkingComplete(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from("course_enrollments")
                .update({ completed: true } as any)
                .eq("course_id", courseId)
                .eq("user_id", user.id);

            if (error) throw error;

            setIsCompleted(true);
            toast({
                title: "Course Completed!",
                description: "You have marked this course as 100% complete. You can now request your certificate from the dashboard.",
            });
            setTimeout(() => setOpen(false), 1500);
        } catch (error) {
            console.error("Error marking complete:", error);
            toast({
                title: "Error",
                description: "Failed to update progress.",
                variant: "destructive",
            });
        } finally {
            setMarkingComplete(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Modules
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Modules: {courseTitle}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] mt-4 pr-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : modules.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No modules listed for this course yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {modules.map((mod, index) => (
                                <div key={mod.id} className="rounded-lg border bg-card p-4 shadow-sm">
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className="font-semibold text-sm">
                                            <span className="text-muted-foreground mr-2">{index + 1}.</span>
                                            {mod.title}
                                        </h4>
                                        {mod.price_cents > 0 && (
                                            <span className="shrink-0 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                                                ৳{mod.price_cents / 100}
                                            </span>
                                        )}
                                    </div>
                                    {mod.description && (
                                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                            {mod.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="pt-4 border-t mt-2">
                    {!isEnrolled ? (
                        <Button className="w-full" variant="hero" asChild>
                            <Link to={`/enroll/${courseId}`}>Enroll Now</Link>
                        </Button>
                    ) : isCompleted ? (
                        <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg font-bold">
                            <CheckCircle2 className="h-5 w-5" />
                            Course Completed
                        </div>
                    ) : (
                        <Button
                            className="w-full"
                            variant="hero"
                            onClick={handleMarkComplete}
                            disabled={loading || markingComplete || modules.length === 0}
                        >
                            {markingComplete ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Mark as 100% Complete
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog >
    );
}
