import { Star, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import courseReact from "@/assets/course-react.jpg";
import { formatCourseTitle } from "@/lib/formatTitle";

export interface CourseData {
  id: string;
  title: string;
  slug?: string;
  description: string | null;
  price_cents: number;
  old_price_cents?: number | null;
  cover_image_path: string | null;
  mode?: string;
  rating?: number;
  reviews?: number;
  badge_text?: string;
  instructor_heading?: string;
  instructor_subheading?: string;
  published?: boolean;
}

interface CourseCardProps {
  course: CourseData;
  showEnrollButton?: boolean;
}

export function CourseCard({ course, showEnrollButton = true }: CourseCardProps) {
  const displayTitle = formatCourseTitle(course.title);
  const courseUrl = `/courses/${course.slug || course.id}`;
  const enrollUrl = `/enroll/${course.id}`;
  const coverImage = course.cover_image_path || courseReact;
  const ratingNum = typeof course.rating === "number" ? course.rating : Number(course.rating || 5.0);
  const ratingValue = isNaN(ratingNum) ? "5.0" : ratingNum.toFixed(1);
  const reviewsCount = typeof course.reviews === "number" ? course.reviews : (Number(course.reviews) || 0);
  const badgeLabel = course.badge_text || "Professional";
  const modeLabel = course.mode || "Online";
  const instructorTitle = course.instructor_heading || "Taught by Experts";
  const instructorRole = course.instructor_subheading || "Industry Professionals";
  const priceNum = typeof course.price_cents === "number" ? course.price_cents : (Number(course.price_cents) || 0);
  const currentPrice = Math.round(priceNum / 100).toLocaleString();
  const oldPriceNum = course.old_price_cents != null ? Number(course.old_price_cents) : null;
  const oldPrice = oldPriceNum != null && !isNaN(oldPriceNum)
    ? Math.round(oldPriceNum / 100).toLocaleString()
    : null;

  return (
    <article className="border-beam-card group relative flex flex-col justify-between rounded-xl">
      <div className="relative z-10 flex h-full flex-col justify-between rounded-[calc(0.75rem-1.5px)] bg-card overflow-hidden">
        <div>
          {/* Cover Image & Badges */}
          <Link to={courseUrl} className="block relative aspect-[16/10] w-full overflow-hidden bg-surface-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset">
            <img
              src={coverImage}
              alt={`Cover image for ${displayTitle}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
              loading="lazy"
            />
            <div className="absolute left-3 top-3 flex items-center gap-1.5">
              <span className="rounded-md border border-border/70 bg-background/85 px-2 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur-sm">
                COURSE
              </span>
              <span className="rounded-md border border-primary/30 bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase backdrop-blur-sm">
                {modeLabel}
              </span>
            </div>
          </Link>

          {/* Card Body */}
          <div className="p-5 sm:p-6">
            {/* Rating & Badge */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{ratingValue}</span>
                <span className="text-muted-foreground font-normal">({reviewsCount} reviews)</span>
              </div>
              <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary text-[11px] font-medium py-0.5 px-2">
                {badgeLabel}
              </Badge>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold tracking-tight text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              <Link to={courseUrl} className="focus:outline-none focus:underline">
                {displayTitle}
              </Link>
            </h3>

            {/* Description */}
            {course.description && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                {course.description}
              </p>
            )}

            {/* Instructor & Pricing */}
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-foreground">{instructorTitle}</div>
                <div className="text-[11px] text-muted-foreground">{instructorRole}</div>
              </div>
              <div className="text-right">
                {oldPrice && (
                  <div className="text-xs text-muted-foreground line-through decoration-destructive/60">
                    ৳{oldPrice}
                  </div>
                )}
                <div className="text-xl font-bold font-mono text-foreground tabular-nums">
                  ৳{currentPrice}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
          <div className={`grid ${showEnrollButton ? "grid-cols-2" : "grid-cols-1"} gap-2 pt-2 border-t border-border/40`}>
            <Button
              variant="outline"
              size="sm"
              className="group/btn w-full text-xs font-medium border-border/80 bg-surface-2/40 hover:bg-surface-2 hover:border-primary/50 text-foreground transition-all duration-200"
              asChild
            >
              <Link to={courseUrl} className="flex items-center justify-center gap-1.5">
                <span>View Details</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-hover/btn:translate-x-1 group-hover/btn:text-primary" />
              </Link>
            </Button>
            {showEnrollButton && (
              <Button
                variant="hero"
                size="sm"
                className="group/btn w-full text-xs font-semibold transition-all duration-200"
                asChild
              >
                <Link to={enrollUrl} className="flex items-center justify-center gap-1.5">
                  <span>Enroll Now</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
