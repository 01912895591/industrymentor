import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, User } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";

export default function BlogPost() {
    const { slug } = useParams();
    const [blog, setBlog] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const { data, error } = await supabase
                    .from("blogs")
                    .select("*")
                    .eq("slug", slug)
                    .single();

                if (error) throw error;
                setBlog(data);
            } catch (err) {
                console.error("Error fetching blog post:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBlog();
    }, [slug]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-20">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center py-20">
                <SEOHead
                    title="Post Not Found — IndustryMentor"
                    noindex={true}
                />
                <h1 className="text-4xl font-black mb-4">Post Not Found</h1>
                <p className="text-muted-foreground mb-8 text-lg">The blog post you're looking for doesn't exist or has been removed.</p>
                <Button variant="hero" asChild>
                    <Link to="/blogs">Back to Blog</Link>
                </Button>
            </div>
        );
    }

    return (
        <main className="flex-1 py-12 px-4 sm:px-6">
            <SEOHead
                title={`${blog.title} | IndustryMentor`}
                description={blog.content?.slice(0, 160) || "Technical article by IndustryMentor practitioners."}
                canonicalUrl={`https://industrymentor.net/blog/${blog.slug}`}
                ogType="article"
                ogImage={blog.cover_image_url || undefined}
                jsonLd={[
                    {
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        headline: blog.title,
                        datePublished: blog.created_at,
                        image: blog.cover_image_url || undefined,
                        author: {
                            "@type": "Organization",
                            name: "IndustryMentor",
                        },
                        publisher: {
                            "@type": "Organization",
                            name: "IndustryMentor",
                            url: "https://industrymentor.net",
                        },
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            {
                                "@type": "ListItem",
                                position: 1,
                                name: "Home",
                                item: "https://industrymentor.net/",
                            },
                            {
                                "@type": "ListItem",
                                position: 2,
                                name: "Blogs",
                                item: "https://industrymentor.net/blogs",
                            },
                            {
                                "@type": "ListItem",
                                position: 3,
                                name: blog.title,
                                item: `https://industrymentor.net/blog/${blog.slug}`,
                            },
                        ],
                    },
                ]}
            />
            <article className="mx-auto max-w-4xl">
                <Button variant="ghost" className="mb-8 p-0 hover:bg-transparent hover:text-primary transition-colors" asChild>
                    <Link to="/blogs">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Blog
                    </Link>
                </Button>

                <header className="mb-12">
                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl leading-tight mb-6">
                        {blog.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            {new Date(blog.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Industry Mentor
                        </div>
                    </div>
                </header>

                <div className="aspect-[21/9] w-full overflow-hidden rounded-3xl mb-12 shadow-elev">
                    <img
                        src={blog.cover_image_url || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80"}
                        alt={blog.title || "IndustryMentor Blog Post Cover"}
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none">
                    {blog.content ? (
                        <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                            {blog.content}
                        </div>
                    ) : (
                        <p className="italic text-muted-foreground">No content provided for this post yet.</p>
                    )}
                </div>

                <div className="mt-16 pt-8 border-t border-border/60">
                    <div className="bg-card/30 p-8 rounded-3xl border border-border/60">
                        <h3 className="text-xl font-bold mb-4">Enjoyed this article?</h3>
                        <p className="text-muted-foreground mb-6">Explore our courses and mentorship programs to take your skills to the next level.</p>
                        <Button variant="hero" asChild>
                            <Link to="/courses">Browse Courses</Link>
                        </Button>
                    </div>
                </div>
            </article>
        </main>
    );
}
