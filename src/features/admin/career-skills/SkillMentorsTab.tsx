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
  Users,
  Loader2,
  Award,
  AlertTriangle,
  Pencil,
  Check,
  X,
} from "lucide-react";
import type { SkillRow, SkillMentorRow, MentorOption } from "@/hooks/useCareer";

interface SkillMentorsTabProps {
  skills: SkillRow[];
  skillMentors: SkillMentorRow[];
  mentors: MentorOption[];
  selectedSkillId?: string;
  onSelectSkillId?: (id: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function SkillMentorsTab({
  skills,
  skillMentors,
  mentors,
  selectedSkillId,
  onSelectSkillId,
  isLoading,
  onRefresh,
}: SkillMentorsTabProps) {
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

  // Attached mentors
  const attachedMentors = useMemo(() => {
    return skillMentors
      .filter((sm) => sm.skill_id === activeSkillId)
      .map((sm) => {
        const mentor = mentors.find((m) => m.id === sm.mentor_id);
        return {
          ...sm,
          mentor,
        };
      })
      .sort((a, b) => a.order_index - b.order_index);
  }, [skillMentors, activeSkillId, mentors]);

  // Available mentors not yet linked
  const availableMentors = useMemo(() => {
    const attachedIds = new Set(
      skillMentors.filter((sm) => sm.skill_id === activeSkillId).map((sm) => sm.mentor_id)
    );
    return mentors.filter((m) => !attachedIds.has(m.id));
  }, [mentors, skillMentors, activeSkillId]);

  // Form states for attaching mentor
  const [newMentorId, setNewMentorId] = useState("");
  const [newIsLead, setNewIsLead] = useState(true);
  const [newSpecNote, setNewSpecNote] = useState("");
  const [newOrder, setNewOrder] = useState(1);
  const [isAttaching, setIsAttaching] = useState(false);

  // Inline note editing
  const [editingNoteMentorId, setEditingNoteMentorId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");

  // Remove confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<{
    skillId: string;
    mentorId: string;
    name: string;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [busyMentorId, setBusyMentorId] = useState<string | null>(null);

  const handleSelectSkill = (id: string) => {
    setActiveSkillId(id);
    onSelectSkillId?.(id);
    setNewMentorId("");
  };

  const handleAttachMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSkillId || !newMentorId) {
      toast({ title: "Please choose a mentor to link", variant: "destructive" });
      return;
    }

    setIsAttaching(true);
    try {
      const payload = {
        skill_id: activeSkillId,
        mentor_id: newMentorId,
        is_lead: newIsLead,
        specialization_note: newSpecNote.trim() || null,
        order_index: Number(newOrder),
      };

      const { error } = await supabase.from("skill_mentors").insert([payload]);
      if (error) throw error;

      toast({
        title: "Mentor Assigned to Skill",
        description: "Faculty attribution saved successfully.",
      });
      setNewMentorId("");
      setNewSpecNote("");
      setNewOrder(attachedMentors.length + 2);
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Link Failed",
        description: err.message || "Failed to link mentor.",
        variant: "destructive",
      });
    } finally {
      setIsAttaching(false);
    }
  };

  const handleToggleLead = async (mapping: SkillMentorRow) => {
    setBusyMentorId(mapping.mentor_id);
    try {
      const nextLead = !mapping.is_lead;
      const { error } = await supabase
        .from("skill_mentors")
        .update({ is_lead: nextLead })
        .match({ skill_id: mapping.skill_id, mentor_id: mapping.mentor_id });

      if (error) throw error;
      toast({ title: nextLead ? "Marked as Lead Mentor" : "Marked as Contributing Mentor" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setBusyMentorId(null);
    }
  };

  const handleSaveNote = async (mapping: SkillMentorRow) => {
    setBusyMentorId(mapping.mentor_id);
    try {
      const { error } = await supabase
        .from("skill_mentors")
        .update({ specialization_note: tempNote.trim() || null })
        .match({ skill_id: mapping.skill_id, mentor_id: mapping.mentor_id });

      if (error) throw error;
      toast({ title: "Specialization Note Updated" });
      setEditingNoteMentorId(null);
      onRefresh();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setBusyMentorId(null);
    }
  };

  const handleOrderChange = async (mapping: SkillMentorRow, newOrderVal: number) => {
    if (newOrderVal < 0) return;
    setBusyMentorId(mapping.mentor_id);
    try {
      const { error } = await supabase
        .from("skill_mentors")
        .update({ order_index: newOrderVal })
        .match({ skill_id: mapping.skill_id, mentor_id: mapping.mentor_id });

      if (error) throw error;
      toast({ title: "Order Index Updated" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setBusyMentorId(null);
    }
  };

  const confirmRemove = async () => {
    if (!mappingToDelete) return;
    setIsRemoving(true);
    try {
      const { error } = await supabase
        .from("skill_mentors")
        .delete()
        .match({
          skill_id: mappingToDelete.skillId,
          mentor_id: mappingToDelete.mentorId,
        });

      if (error) throw error;
      toast({
        title: "Mentor Unlinked",
        description: `"${mappingToDelete.name}" has been unlinked from this skill.`,
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
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <Users className="h-5 w-5" />
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
                {attachedMentors.length} Mentors Assigned
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Attached Mentors */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="p-4 bg-muted/20 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Assigned Mentors for {activeSkill?.title || "Skill"}</span>
                <Badge variant="secondary" className="text-xs">
                  {attachedMentors.length} Assigned
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Real mentors from <code>public.mentors</code> attributed to teaching this floor competency.
              </CardDescription>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="w-16 text-center">Order</TableHead>
                    <TableHead>Mentor & Role</TableHead>
                    <TableHead>Specialization Note</TableHead>
                    <TableHead className="text-center">Attribution</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attachedMentors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                        No mentors currently attributed to this competency. Use the form on the right to link faculty.
                      </TableCell>
                    </TableRow>
                  ) : (
                    attachedMentors.map((mapping) => {
                      const isBusy = busyMentorId === mapping.mentor_id;
                      const mentor = mapping.mentor;
                      const isEditingNote = editingNoteMentorId === mapping.mentor_id;

                      return (
                        <TableRow key={mapping.mentor_id} className="hover:bg-muted/20">
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

                          {/* Mentor Info */}
                          <TableCell>
                            <div className="font-medium text-sm text-foreground flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                              <span>{mentor?.name || mapping.mentor_id}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-[200px]">
                              {mentor?.title || "Industry Mentor"}
                            </div>
                          </TableCell>

                          {/* Specialization Note */}
                          <TableCell>
                            {isEditingNote ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={tempNote}
                                  onChange={(e) => setTempNote(e.target.value)}
                                  placeholder="e.g. Order Execution & SCM Strategy"
                                  className="h-7 text-xs w-48"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-emerald-400 hover:text-emerald-300"
                                  onClick={() => handleSaveNote(mapping)}
                                  disabled={isBusy}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground"
                                  onClick={() => setEditingNoteMentorId(null)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 group">
                                <span className="text-xs text-foreground/90 font-medium">
                                  {mapping.specialization_note || (
                                    <span className="text-muted-foreground italic text-[11px]">None</span>
                                  )}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    setEditingNoteMentorId(mapping.mentor_id);
                                    setTempNote(mapping.specialization_note || "");
                                  }}
                                  title="Edit note"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>

                          {/* Lead vs Contributor */}
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleToggleLead(mapping)}
                              className="h-7 px-2 hover:bg-transparent"
                            >
                              {mapping.is_lead ? (
                                <Badge variant="default" className="cursor-pointer gap-1 text-[10px] bg-cyan-500/15 text-cyan-400 border-cyan-500/20">
                                  <Award className="h-3 w-3" />
                                  Lead Mentor
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="cursor-pointer text-[10px] text-muted-foreground">
                                  Faculty
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
                                  mentorId: mapping.mentor_id,
                                  name: mentor?.name || "this mentor",
                                });
                                setDeleteDialogOpen(true);
                              }}
                              title="Unlink mentor"
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

        {/* Right 1 Col: Attach Mentor Form */}
        <div className="space-y-3">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="p-4 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-cyan-400" />
                Attribute Existing Mentor
              </CardTitle>
              <CardDescription className="text-xs">
                Link real mentor profiles from <code>public.mentors</code>.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              <form onSubmit={handleAttachMentor} className="space-y-3.5">
                {/* Select Mentor */}
                <div className="space-y-1.5">
                  <Label htmlFor="attach-mentor-select" className="text-xs font-semibold">
                    Select Mentor <span className="text-destructive">*</span>
                  </Label>
                  <Select value={newMentorId} onValueChange={setNewMentorId}>
                    <SelectTrigger id="attach-mentor-select" className="text-xs">
                      <SelectValue placeholder="Choose mentor..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {availableMentors.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                          All available mentors are already linked to this skill.
                        </div>
                      ) : (
                        availableMentors.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="text-xs">
                            {m.name} ({m.title})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Specialization Note */}
                <div className="space-y-1.5">
                  <Label htmlFor="mentor-note" className="text-xs font-semibold">
                    Specialization Context Note
                  </Label>
                  <Input
                    id="mentor-note"
                    value={newSpecNote}
                    onChange={(e) => setNewSpecNote(e.target.value)}
                    placeholder="e.g. Certified Lean Six Sigma Black Belt (LSSBB)"
                    className="text-xs"
                  />
                </div>

                {/* Order Index */}
                <div className="space-y-1.5">
                  <Label htmlFor="mentor-order" className="text-xs font-semibold">
                    Display Order Index
                  </Label>
                  <Input
                    id="mentor-order"
                    type="number"
                    min={0}
                    value={newOrder}
                    onChange={(e) => setNewOrder(parseInt(e.target.value, 10) || 0)}
                    className="text-xs"
                  />
                </div>

                {/* Is Lead */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-muted/20">
                  <div>
                    <Label htmlFor="mentor-lead" className="text-xs font-semibold cursor-pointer">
                      Lead Faculty
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      {newIsLead ? "Primary lead faculty instructor" : "Contributing mentor"}
                    </p>
                  </div>
                  <Switch
                    id="mentor-lead"
                    checked={newIsLead}
                    onCheckedChange={setNewIsLead}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full text-xs font-semibold mt-2"
                  disabled={isAttaching || !newMentorId || availableMentors.length === 0}
                >
                  {isAttaching && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Assign Mentor to Skill
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
              <AlertDialogTitle>Unlink Mentor from Skill?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground">
              <p>
                Are you sure you want to unlink{" "}
                <strong className="text-foreground">"{mappingToDelete?.name}"</strong> from{" "}
                <strong className="text-foreground">{activeSkill?.title}</strong>?
              </p>
              <p className="text-xs text-muted-foreground">
                This removes faculty attribution for this skill only. The mentor's profile is unaffected.
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
              Unlink Mentor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
