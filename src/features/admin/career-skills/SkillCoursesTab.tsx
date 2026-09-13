import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Trash2,
  Compass,
  BookOpen,
  Loader2,
  Star,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import type { SkillRow, SkillCourseRow, CourseOption } from "@/hooks/useCareer";

interface SkillCoursesTabProps {
  skills: SkillRow[];
  skillCourses: SkillCourseRow[];
  courses: CourseOption[];
  selectedSkillId?: string;
  onSelectSkillId?: (id: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function SkillCoursesTab({
  skills,
  skillCourses,
  courses,
  selectedSkillId,
  onSelectSkillId,
  isLoading,
  onRefresh,
}: SkillCoursesTabProps) {
  const [activeSkillId, setActiveSkillId] = useState<string>(
    selectedSkillId || (skills[0]?.id ?? "")
  );

  React.useEffect(() => {
    if (selectedSkillId && selectedSkillId !== activeSkillId) {
      setActiveSkillId(selectedSkillId);
    } else if (!activeSkillId && skills.length > 0) {
      setActiveSkillId(skills[0].id);
    }
  }, [selectedSkillId, skills]);

  const activeSkill = useMemo(
    () => skills.find((s) => s.id === activeSkillId),
    [skills, activeSkillId]
  );

  // Attached courses for this skill
  const attachedCourses = useMemo(() => {
    return skillCourses
      .filter((sc) => sc.skill_id === activeSkillId)
      .map((sc) => {
        const course = courses.find((c) => c.id === sc.course_id);
        return {
          ...sc,
          course,
        };
      })
      .sort((a, b) => a.order_index - b.order_index);
  }, [skillCourses, activeSkillId, courses]);

  // Available real courses not yet attached
  const availableCourses = useMemo(() => {
    const attachedIds = new Set(
      skillCourses.filter((sc) => sc.skill_id === activeSkillId).map((sc) => sc.course_id)
    );
    return courses.filter((c) => !attachedIds.has(c.id));
  }, [courses, skillCourses, activeSkillId]);

  // Form states
  const [newCourseId, setNewCourseId] = useState("");
  const [newIsPrimary, setNewIsPrimary] = useState(true);
  const [newOrder, setNewOrder] = useState(1);
  const [isAttaching, setIsAttaching] = useState(false);

  // Remove confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<{
    skillId: string;
    courseId: string;
    title: string;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null);

  const handleSelectSkill = (id: string) => {
    setActiveSkillId(id);
    onSelectSkillId?.(id);
    setNewCourseId("");
  };

  const handleAttachCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSkillId || !newCourseId) {
      toast({ title: "Please choose a course to link", variant: "destructive" });
      return;
    }

    setIsAttaching(true);
    try {
      const payload = {
        skill_id: activeSkillId,
        course_id: newCourseId,
        is_primary: newIsPrimary,
        order_index: Number(newOrder),
      };

      const { error } = await supabase.from("skill_courses").insert([payload]);
      if (error) throw error;

      toast({
        title: "Course Linked to Skill",
        description: "Course assignment saved successfully.",
      });
      setNewCourseId("");
      setNewOrder(attachedCourses.length + 2);
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Link Failed",
        description: err.message || "Failed to link course.",
        variant: "destructive",
      });
    } finally {
      setIsAttaching(false);
    }
  };

  const handleTogglePrimary = async (mapping: SkillCourseRow) => {
    setBusyCourseId(mapping.course_id);
    try {
      const nextPrimary = !mapping.is_primary;
      const { error } = await supabase
        .from("skill_courses")
        .update({ is_primary: nextPrimary })
        .match({ skill_id: mapping.skill_id, course_id: mapping.course_id });

      if (error) throw error;
      toast({ title: nextPrimary ? "Marked as Primary Course" : "Marked as Secondary Course" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setBusyCourseId(null);
    }
  };

  const handleOrderChange = async (mapping: SkillCourseRow, newOrderVal: number) => {
    if (newOrderVal < 0) return;
    setBusyCourseId(mapping.course_id);
    try {
      const { error } = await supabase
        .from("skill_courses")
        .update({ order_index: newOrderVal })
        .match({ skill_id: mapping.skill_id, course_id: mapping.course_id });

      if (error) throw error;
      toast({ title: "Order Index Updated" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setBusyCourseId(null);
    }
  };

  const confirmRemove = async () => {
    if (!mappingToDelete) return;
    setIsRemoving(true);
    try {
      const { error } = await supabase
        .from("skill_courses")
        .delete()
        .match({
          skill_id: mappingToDelete.skillId,
          course_id: mappingToDelete.courseId,
        });

      if (error) throw error;
      toast({
        title: "Course Unlinked",
        description: `"${mappingToDelete.title}" has been unlinked from this skill.`,
      });
      setDeleteDialogOpen(false);
      setMappingToDelete(null);
      onRefresh();
    } catch (err: any) {
      toast({ title: "Remove Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Skill Selector */}
      <Card className="border-border/60 bg-card/40">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Select Competency Skill</Label>
              <Select value={activeSkillId} onValueChange={handleSelectSkill}>
                <SelectTrigger className="w-full sm:w-[380px] font-semibold text-sm h-9 mt-0.5">
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {skills.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-sm">
                      {s.title} ({s.domain} • {s.difficulty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeSkill && (
            <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-muted-foreground">
              <Badge variant="outline" className="font-mono text-[11px]">
                {activeSkill.slug}
              </Badge>
              <span>•</span>
              <span className="font-semibold text-foreground">
                {attachedCourses.length} Courses Linked
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Attached Courses */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="p-4 bg-muted/20 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Associated Courses for {activeSkill?.title || "Skill"}</span>
                <Badge variant="secondary" className="text-xs">
                  {attachedCourses.length} Linked
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Real courses teaching this specific skill. Students can enroll directly into these courses.
              </CardDescription>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="w-16 text-center">Order</TableHead>
                    <TableHead>Course Title</TableHead>
                    <TableHead className="text-center">Price</TableHead>
                    <TableHead className="text-center">Coverage Role</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attachedCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                        No courses currently linked to this competency. Use the form on the right to attach a course.
                      </TableCell>
                    </TableRow>
                  ) : (
                    attachedCourses.map((mapping) => {
                      const isBusy = busyCourseId === mapping.course_id;
                      const course = mapping.course;

                      return (
                        <TableRow key={mapping.course_id} className="hover:bg-muted/20">
                          {/* Order Index */}
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min={0}
                              value={mapping.order_index}
                              disabled={isBusy}
                              onChange={(e) =>
                                handleOrderChange(mapping, parseInt(e.target.value, 10) || 0)
                              }
                              className="w-14 h-7 text-center text-xs font-mono p-1 mx-auto"
                            />
                          </TableCell>

                          {/* Course info */}
                          <TableCell>
                            <div className="font-medium text-sm text-foreground flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                              <span>{course?.title || mapping.course_id}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <code className="text-[10px] text-muted-foreground font-mono">
                                {course?.slug}
                              </code>
                              {course?.published ? (
                                <span className="text-[10px] text-emerald-400 font-medium">Published</span>
                              ) : (
                                <span className="text-[10px] text-amber-400 font-medium">Draft</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Price */}
                          <TableCell className="text-center text-xs">
                            {course ? (
                              course.price_cents > 0 ? (
                                <span className="font-semibold text-foreground">
                                  ${(course.price_cents / 100).toFixed(2)}
                                </span>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">Free</Badge>
                              )
                            ) : (
                              "—"
                            )}
                          </TableCell>

                          {/* Primary vs Secondary */}
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleTogglePrimary(mapping)}
                              className="h-7 px-2 hover:bg-transparent"
                            >
                              {mapping.is_primary ? (
                                <Badge variant="warning" className="cursor-pointer gap-1 text-[10px]">
                                  <Star className="h-3 w-3 fill-amber-400" />
                                  Primary Course
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="cursor-pointer text-[10px] text-muted-foreground">
                                  Supplementary
                                </Badge>
                              )}
                            </Button>
                          </TableCell>

                          {/* Remove */}
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isBusy}
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setMappingToDelete({
                                  skillId: mapping.skill_id,
                                  courseId: mapping.course_id,
                                  title: course?.title || "this course",
                                });
                                setDeleteDialogOpen(true);
                              }}
                              title="Unlink course"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Attach Course Form */}
        <div className="space-y-3">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="p-4 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-amber-400" />
                Attach Existing Course
              </CardTitle>
              <CardDescription className="text-xs">
                Select from verified live courses in <code>public.courses</code>.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              <form onSubmit={handleAttachCourse} className="space-y-3.5">
                {/* Select Course */}
                <div className="space-y-1.5">
                  <Label htmlFor="attach-course-select" className="text-xs font-semibold">
                    Select Course <span className="text-destructive">*</span>
                  </Label>
                  <Select value={newCourseId} onValueChange={setNewCourseId}>
                    <SelectTrigger id="attach-course-select" className="text-xs">
                      <SelectValue placeholder="Choose course..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {availableCourses.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                          All available courses are already linked to this skill.
                        </div>
                      ) : (
                        availableCourses.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Index */}
                <div className="space-y-1.5">
                  <Label htmlFor="course-order" className="text-xs font-semibold">
                    Display Order Index
                  </Label>
                  <Input
                    id="course-order"
                    type="number"
                    min={0}
                    value={newOrder}
                    onChange={(e) => setNewOrder(parseInt(e.target.value, 10) || 0)}
                    className="text-xs"
                  />
                </div>

                {/* Is Primary */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-muted/20">
                  <div>
                    <Label htmlFor="course-primary" className="text-xs font-semibold cursor-pointer">
                      Primary Course
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      {newIsPrimary ? "Main recommended course for this skill" : "Additional supplementary course"}
                    </p>
                  </div>
                  <Switch
                    id="course-primary"
                    checked={newIsPrimary}
                    onCheckedChange={setNewIsPrimary}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full text-xs font-semibold mt-2"
                  disabled={isAttaching || !newCourseId || availableCourses.length === 0}
                >
                  {isAttaching && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Attach Course to Skill
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Remove Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-border bg-background max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Unlink Course from Skill?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground">
              <p>
                Are you sure you want to unlink{" "}
                <strong className="text-foreground">"{mappingToDelete?.title}"</strong> from{" "}
                <strong className="text-foreground">{activeSkill?.title}</strong>?
              </p>
              <p className="text-xs text-muted-foreground">
                This removes only the mapping association. The course record itself is unaffected.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Unlink Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
