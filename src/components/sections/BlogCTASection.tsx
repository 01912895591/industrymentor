import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export function BlogCTASection() {
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const { data, error } = await (supabase as any)
                    .from("blogs")
                    .select("*")
                    .eq("published", true)
                    .order("created_at", { ascending: false })
                    .limit(3);

                if (error) {
                    // Fail silently if table doesn't exist yet
                    if (error.code === "42P01" || error.message?.includes("Could not find the table")) {
                        setBlogs([]);
                        return;
                    }
                    throw error;
                }
                setBlogs(data || []);
            } catch (err) {
                console.log("Blog section hidden (setup required)");
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    if (!loading && blogs.length === 0) return null;

    return (
        <section id="blog-cta" className="scroll-mt-24 py-20 lg:py-24 bg-card/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="flex flex-col items-center justify-center gap-6 mb-12 text-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Latest from our <span className="text-primary">Blog</span>
                        </h2>
                        <p className="mt-4 max-w-2xl text-base text-muted-foreground mx-auto">
                            Deep dives into garment industry trends, tutorials, and career advice from experts.
                        </p>
                    </div>
                    <Button variant="soft" size="lg" asChild className="hidden md:flex">
                        <Link to="/blog">
                            View All Posts
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="h-[450px] rounded-xl bg-card/25 animate-pulse border border-border/60" />
                        ))
                    ) : (
                        blogs.map((blog) => (
                            <Card key={blog.id} className="group overflow-hidden rounded-xl border border-border/70 bg-card/40 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1">
                                <div className="aspect-video overflow-hidden">
                                    <img
                                        src={blog.cover_image_url || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80"}
                                        alt={blog.title}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                                <CardHeader className="p-6">
                                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground font-medium">
                                        <Calendar className="h-3.5 w-3.5 text-primary" />
                                        {new Date(blog.created_at).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <CardTitle className="line-clamp-2 text-xl font-bold group-hover:text-primary transition-colors leading-tight">
                                        {blog.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 pb-6 pt-0">
                                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                        {blog.excerpt || "Dive deep into this topic with our expert mentors and scale your garment industry career..."}
                                    </p>
                                </CardContent>
                                <CardFooter className="px-6 pb-6 pt-0 mt-auto">
                                    <Button variant="outline" className="w-full font-semibold text-xs h-9 hover:border-primary/50 hover:text-primary" asChild>
                                        <Link to={`/blog/${blog.slug}`}>
                                            Read Article
                                            <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>

                <div className="mt-12 flex justify-center md:hidden">
                    <Button variant="soft" size="lg" asChild className="w-full sm:w-auto">
                        <Link to="/blog">
                            View All Posts
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
