import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Eye,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Star,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Send,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { SubmissionStatusBadge } from "./SubmissionStatusBadge";
import type { ProjectSubmissionWithDetails } from "@/types/projects";
import { isValidHttpsUrl } from "@/pages/ProjectWorkspace";

interface ProjectSubmissionsTableProps {
  submissions: ProjectSubmissionWithDetails[];
  isLoading: boolean;
  onReviewClick: (submission: ProjectSubmissionWithDetails) => void;
  onStartReviewClick: (submission: ProjectSubmissionWithDetails) => void;
}

const PAGE_SIZE = 15;

export function ProjectSubmissionsTable({
  submissions,
  isLoading,
  onReviewClick,
  onStartReviewClick,
}: ProjectSubmissionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(submissions.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedSubmissions = submissions.slice(startIndex, startIndex + PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/40 p-8 text-center space-y-3">
        <div className="flex justify-center">
          <Clock className="h-6 w-6 animate-spin text-primary" />
        </div>
        <p className="text-xs text-muted-foreground">Loading submissions...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-12 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Send className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-sm font-bold text-foreground">
            No Submissions Found
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            When students submit their solutions from their project workspaces, deliverables will appear here for review and evaluation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="text-xs font-semibold text-foreground w-[200px]">
                Student
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground min-w-[220px]">
                Project
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground min-w-[200px]">
                Submission Deliverable
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground w-[160px]">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground w-[140px]">
                Submitted
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground w-[140px]">
                Last Review
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right w-[120px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSubmissions.map((sub) => {
              const submittedDate = sub.submitted_at
                ? new Date(sub.submitted_at)
                : new Date(sub.created_at);

              const reviewedDate = sub.reviewed_at ? new Date(sub.reviewed_at) : null;
              const hasValidUrl = sub.deliverable_url ? isValidHttpsUrl(sub.deliverable_url) : false;

              return (
                <TableRow
                  key={sub.id}
                  className="hover:bg-muted/30 border-border/40 transition-colors"
                >
                  {/* Student */}
                  <TableCell className="py-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <User className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {sub.student?.full_name || "Enrolled Student"}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        UID: {sub.user_id.substring(0, 8)}
                      </div>
                    </div>
                  </TableCell>

                  {/* Project */}
                  <TableCell className="py-3">
                    <div className="space-y-1 max-w-[260px]">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {sub.project?.title || "Unknown Project"}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {sub.project?.domain && (
                          <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                            {sub.project.domain}
                          </span>
                        )}
                        {sub.project?.difficulty && (
                          <span className="text-[10px] text-primary/80 font-medium">
                            {sub.project.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Submission Deliverable */}
                  <TableCell className="py-3">
                    <div className="space-y-1 max-w-[220px]">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {sub.title || "Untitled Submission"}
                      </div>
                      {sub.deliverable_url ? (
                        <div className="flex items-center gap-1">
                          {hasValidUrl ? (
                            <a
                              href={sub.deliverable_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-mono truncate max-w-[180px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>{sub.deliverable_url.replace(/^https?:\/\//i, "")}</span>
                              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-destructive font-mono">
                              Insecure URL
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">
                          No URL
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3">
                    <div className="space-y-1">
                      <SubmissionStatusBadge status={sub.status} />
                      {sub.portfolio_item && (
                        <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
                          <Star className="h-2.5 w-2.5 fill-primary" />
                          <span>Portfolio Featured</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Submitted */}
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    <div className="space-y-0.5">
                      <div>{format(submittedDate, "MMM d, yyyy")}</div>
                      <div className="text-[10px] text-muted-foreground/70">
                        {formatDistanceToNow(submittedDate, { addSuffix: true })}
                      </div>
                    </div>
                  </TableCell>

                  {/* Last Reviewed */}
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    {reviewedDate ? (
                      <div className="space-y-0.5">
                        <div>{format(reviewedDate, "MMM d, yyyy")}</div>
                        <div className="text-[10px] text-muted-foreground/70 truncate max-w-[110px]">
                          {sub.reviewer?.full_name || "Admin"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/60 italic">
                        Not reviewed yet
                      </span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {sub.status === "submitted" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onStartReviewClick(sub)}
                          className="h-8 text-xs font-semibold gap-1 bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Start Review</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onReviewClick(sub)}
                          className="h-8 text-xs font-semibold gap-1 border border-border/60 hover:bg-muted"
                        >
                          <span>Review</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
          <span>
            Page <strong className="text-foreground">{currentPage}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 text-xs gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
