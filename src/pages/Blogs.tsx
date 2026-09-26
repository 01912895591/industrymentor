import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ChevronRight } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";

export default function Blogs() {
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const { data, error } = await (supabase as any)
                    .from("blogs")
                    .select("*")
                    .eq("published", true)
                    .order("created_at", { ascending: false });

                if (error) {
                    if (error.code === "42P01" || error.message?.includes("Could not find the table")) {
                        // Table missing, just show empty state
                        setBlogs([]);
                        return;
                    }
                    throw error;
                }
                setBlogs(data || []);
            } catch (err) {
                console.error("Error fetching blogs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    return (
        <main className="flex-1 py-16 px-4 sm:px-6">
            <SEOHead
                title="Industry Insights & Articles | IndustryMentor Blog"
                description="Stay updated with the latest insights, trends, and tutorials from industry mentors."
                canonicalUrl="https://industrymentor.net/blogs"
            />
            <div className="mx-auto max-w-7xl">
                <div className="text-center mb-8 sm:mb-16">
                    <h1 className="text-2xl xs:text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                        Our <span className="text-primary">Blog</span>
                    </h1>
                    <p className="mt-3 text-sm xs:text-base sm:text-lg text-muted-foreground">
                        Stay updated with the latest insights, trends, and tutorials from industry mentors.
                    </p>
                </div>

                {loading ? (
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-96 rounded-3xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold text-muted-foreground">No blog posts found.</h2>
                        <p className="mt-2 text-muted-foreground">Check back later for new content!</p>
                    </div>
                ) : (
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {blogs.map((blog) => (
                            <Card key={blog.id} className="group overflow-hidden rounded-xl border border-border/70 bg-card/40 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1">
                                <div className="aspect-video overflow-hidden">
                                    <img
                                        src={blog.cover_image_url || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80"}
                                        alt={blog.title || "IndustryMentor Blog Post"}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                                <CardHeader className="p-5 sm:p-6">
                                    <div className="flex items-center gap-2 mb-2 text-[10px] sm:text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(blog.created_at).toLocaleDateString()}
                                    </div>
                                    <CardTitle className="line-clamp-2 text-lg xs:text-xl font-bold group-hover:text-primary transition-colors">
                                        {blog.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
                                    <p className="line-clamp-3 text-xs xs:text-sm leading-relaxed text-muted-foreground">
                                        {blog.excerpt || "Read more about this insightful topic from our experts..."}
                                    </p>
                                </CardContent>
                                <CardFooter className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
                                    <Button variant="outline" className="w-full font-semibold text-xs h-9 hover:border-primary/50 hover:text-primary" asChild>
                                        <Link to={`/blog/${blog.slug}`}>
                                            Read More
                                            <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
