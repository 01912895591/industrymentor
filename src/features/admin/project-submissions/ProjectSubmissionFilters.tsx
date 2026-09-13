import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import type { ProjectSubmissionStatus } from "@/types/projects";

export interface ProjectSubmissionFilterState {
  search: string;
  status: string; // 'all' | ProjectSubmissionStatus
  projectId: string; // 'all' | project.id
  sortBy: "newest" | "oldest" | "status";
}

interface ProjectSubmissionFiltersProps {
  filters: ProjectSubmissionFilterState;
  onChange: (newFilters: ProjectSubmissionFilterState) => void;
  uniqueProjects: Array<{ id: string; title: string }>;
  totalCount: number;
  filteredCount: number;
}

export function ProjectSubmissionFilters({
  filters,
  onChange,
  uniqueProjects,
  totalCount,
  filteredCount,
}: ProjectSubmissionFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (val: string) => {
    onChange({ ...filters, status: val });
  };

  const handleProjectChange = (val: string) => {
    onChange({ ...filters, projectId: val });
  };

  const handleSortChange = (val: string) => {
    onChange({ ...filters, sortBy: val as any });
  };

  const handleClear = () => {
    onChange({
      search: "",
      status: "all",
      projectId: "all",
      sortBy: "newest",
    });
  };

  const isFiltered =
    Boolean(filters.search.trim()) ||
    filters.status !== "all" ||
    filters.projectId !== "all" ||
    filters.sortBy !== "newest";

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-xl p-4 space-y-3.5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name, user ID, or submission title..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-9 pr-8 h-9 text-xs bg-background/60"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="w-full sm:w-44">
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-9 text-xs bg-background/60">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted (Pending)</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="revision_required">Revision Required</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Project Dropdown */}
        {uniqueProjects.length > 0 && (
          <div className="w-full sm:w-56">
            <Select value={filters.projectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="h-9 text-xs bg-background/60 truncate">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {uniqueProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sort Dropdown */}
        <div className="w-full sm:w-36">
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="h-9 text-xs bg-background/60">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-9 text-xs gap-1 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Filter Summary Counter */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
        <span>
          Showing <strong className="text-foreground">{filteredCount}</strong> of{" "}
          <strong className="text-foreground">{totalCount}</strong> submissions
        </span>
        {isFiltered && (
          <span className="text-primary font-medium">Filters active</span>
        )}
      </div>
    </div>
  );
}
