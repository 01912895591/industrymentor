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
  Briefcase,
  Compass,
  Layers,
  Loader2,
  CheckCircle,
  CircleDot,
  AlertTriangle,
} from "lucide-react";
import type { CareerPathRow, SkillRow, CareerPathSkillRow } from "@/hooks/useCareer";

interface CareerPathSkillsTabProps {
  careerPaths: CareerPathRow[];
  skills: SkillRow[];
  careerPathSkills: CareerPathSkillRow[];
  selectedPathId?: string;
  onSelectPathId?: (id: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function CareerPathSkillsTab({
  careerPaths,
  skills,
  careerPathSkills,
  selectedPathId,
  onSelectPathId,
  isLoading,
  onRefresh,
}: CareerPathSkillsTabProps) {
  // Currently active career path ID
  const [activePathId, setActivePathId] = useState<string>(
    selectedPathId || (careerPaths[0]?.id ?? "")
  );

  // Sync if prop changes
  React.useEffect(() => {
    if (selectedPathId && selectedPathId !== activePathId) {
      setActivePathId(selectedPathId);
    } else if (!activePathId && careerPaths.length > 0) {
      setActivePathId(careerPaths[0].id);
    }
  }, [selectedPathId, careerPaths]);

  const activePath = useMemo(
    () => careerPaths.find((p) => p.id === activePathId),
    [careerPaths, activePathId]
  );

  // Attached skills for this path
  const attachedMappings = useMemo(() => {
    return careerPathSkills
      .filter((cps) => cps.career_path_id === activePathId)
      .map((cps) => {
        const skill = skills.find((s) => s.id === cps.skill_id);
        return {
          ...cps,
          skill,
        };
      })
      .sort((a, b) => {
        // Sort by stage_tier asc, then order_index asc
        const tierA = a.stage_tier ?? 1;
        const tierB = b.stage_tier ?? 1;
        if (tierA !== tierB) return tierA - tierB;
        return a.order_index - b.order_index;
      });
  }, [careerPathSkills, activePathId, skills]);

  // Skills available to attach (excluding already attached)
  const availableSkills = useMemo(() => {
    const attachedIds = new Set(
      careerPathSkills
        .filter((cps) => cps.career_path_id === activePathId)
        .map((cps) => cps.skill_id)
    );
    return skills.filter((s) => !attachedIds.has(s.id));
  }, [skills, careerPathSkills, activePathId]);

  // Form states for attaching new skill
  const [newSkillId, setNewSkillId] = useState("");
  const [newTier, setNewTier] = useState<number>(1);
  const [newIsCore, setNewIsCore] = useState(true);
  const [newOrder, setNewOrder] = useState(1);
  const [isAttaching, setIsAttaching] = useState(false);

  // Remove confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<{
    pathId: string;
    skillId: string;
    title: string;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [busySkillId, setBusySkillId] = useState<string | null>(null);

  const handleSelectPath = (id: string) => {
    setActivePathId(id);
    onSelectPathId?.(id);
    setNewSkillId("");
  };

  const handleAttachSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePathId || !newSkillId) {
      toast({ title: "Please select a skill to attach", variant: "destructive" });
      return;
    }

    setIsAttaching(true);
    try {
      const payload = {
        career_path_id: activePathId,
        skill_id: newSkillId,
        stage_tier: Number(newTier),
        is_core: newIsCore,
        order_index: Number(newOrder),
      };

      const { error } = await supabase.from("career_path_skills").insert([payload]);
      if (error) throw error;

      toast({
        title: "Skill Assigned to Pathway",
        description: "Curriculum assignment created successfully.",
      });
      setNewSkillId("");
      setNewOrder(attachedMappings.length + 2);
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Assignment Failed",
        description: err.message || "Could not assign skill.",
        variant: "destructive",
      });
    } finally {
      setIsAttaching(false);
    }
  };

  const handleToggleCore = async (mapping: CareerPathSkillRow) => {
    setBusySkillId(mapping.skill_id);
    try {
      const nextCore = !mapping.is_core;
      const { error } = await supabase
        .from("career_path_skills")
        .update({ is_core: nextCore })
        .match({ career_path_id: mapping.career_path_id, skill_id: mapping.skill_id });

      if (error) throw error;
      toast({ title: nextCore ? "Marked as Core" : "Marked as Elective" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setBusySkillId(null);
    }
  };

  const handleTierChange = async (mapping: CareerPathSkillRow, newTierVal: string) => {
    const tierNum = parseInt(newTierVal, 10);
    if (tierNum < 1 || tierNum > 5) return;

    setBusySkillId(mapping.skill_id);
    try {
      const { error } = await supabase
        .from("career_path_skills")
        .update({ stage_tier: tierNum })
        .match({ career_path_id: mapping.career_path_id, skill_id: mapping.skill_id });

      if (error) throw error;
      toast({ title: `Moved to Stage Tier ${tierNum}` });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setBusySkillId(null);
    }
  };

  const handleOrderChange = async (mapping: CareerPathSkillRow, newOrderVal: number) => {
    if (newOrderVal < 0) return;
    setBusySkillId(mapping.skill_id);
    try {
      const { error } = await supabase
        .from("career_path_skills")
        .update({ order_index: newOrderVal })
        .match({ career_path_id: mapping.career_path_id, skill_id: mapping.skill_id });

      if (error) throw error;
      toast({ title: "Order Index Updated" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setBusySkillId(null);
    }
  };

  const confirmRemove = async () => {
    if (!mappingToDelete) return;
    setIsRemoving(true);
    try {
      const { error } = await supabase
        .from("career_path_skills")
        .delete()
        .match({
          career_path_id: mappingToDelete.pathId,
          skill_id: mappingToDelete.skillId,
        });

      if (error) throw error;
      toast({
        title: "Skill Removed from Pathway",
        description: `"${mappingToDelete.title}" has been unlinked from this career path.`,
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
      {/* Career Path Selector */}
      <Card className="border-border/60 bg-card/40">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Select Career Pathway</Label>
              <Select value={activePathId} onValueChange={handleSelectPath}>
                <SelectTrigger className="w-full sm:w-[360px] font-semibold text-sm h-9 mt-0.5">
                  <SelectValue placeholder="Select a career path" />
                </SelectTrigger>
                <SelectContent>
                  {careerPaths.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-sm">
                      {p.title} ({p.domain})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {activePath && (
            <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-muted-foreground">
              <Badge variant="outline" className="font-mono text-[11px]">
                {activePath.slug}
              </Badge>
              <span>•</span>
              <span className="font-semibold text-foreground">
                {attachedMappings.length} Competencies Assigned
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Attached Skills Table */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="p-4 bg-muted/20 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Curriculum Progression for {activePath?.title || "Pathway"}</span>
                <Badge variant="secondary" className="text-xs">
                  {attachedMappings.length} Total
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Skills ordered by curricular stage tier (1: Fundamentals → 2: Applied → 3: Executive) and display priority.
              </CardDescription>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="w-24">Stage Tier</TableHead>
                    <TableHead className="w-16 text-center">Order</TableHead>
                    <TableHead>Competency Skill</TableHead>
                    <TableHead className="text-center">Requirement</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attachedMappings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                        No skills assigned to this career pathway yet. Use the panel on the right to attach competencies.
                      </TableCell>
                    </TableRow>
                  ) : (
                    attachedMappings.map((mapping) => {
                      const isBusy = busySkillId === mapping.skill_id;
                      const skill = mapping.skill;

                      return (
                        <TableRow key={mapping.skill_id} className="hover:bg-muted/20">
                          {/* Stage Tier Selector */}
                          <TableCell>
                            <Select
                              value={String(mapping.stage_tier || 1)}
                              onValueChange={(val) => handleTierChange(mapping, val)}
                              disabled={isBusy}
                            >
                              <SelectTrigger className="h-7 text-xs font-semibold w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Tier 1</SelectItem>
                                <SelectItem value="2">Tier 2</SelectItem>
                                <SelectItem value="3">Tier 3</SelectItem>
                                <SelectItem value="4">Tier 4</SelectItem>
                                <SelectItem value="5">Tier 5</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

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
                              className="w-14 h-7 text-center text-xs font-mono p-1"
                            />
                          </TableCell>

                          {/* Skill Info */}
                          <TableCell>
                            <div className="font-medium text-sm text-foreground flex items-center gap-1.5">
                              <Compass className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              <span>{skill?.title || mapping.skill_id}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-muted-foreground">
                                {skill?.domain}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-[11px] text-muted-foreground">
                                {skill?.difficulty}
                              </span>
                            </div>
                          </TableCell>

                          {/* Core vs Elective */}
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleToggleCore(mapping)}
                              className="h-7 px-2 hover:bg-transparent"
                            >
                              {mapping.is_core ? (
                                <Badge variant="default" className="cursor-pointer gap-1 text-[11px]">
                                  <CheckCircle className="h-3 w-3" />
                                  Core
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="cursor-pointer gap-1 text-[11px] text-muted-foreground">
                                  <CircleDot className="h-3 w-3" />
                                  Elective
                                </Badge>
                              )}
                            </Button>
                          </TableCell>

                          {/* Delete */}
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isBusy}
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setMappingToDelete({
                                  pathId: mapping.career_path_id,
                                  skillId: mapping.skill_id,
                                  title: skill?.title || "this skill",
                                });
                                setDeleteDialogOpen(true);
                              }}
                              title="Unlink skill from pathway"
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

        {/* Right 1 Col: Attach Skill Form */}
        <div className="space-y-3">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="p-4 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Assign Skill to Pathway
              </CardTitle>
              <CardDescription className="text-xs">
                Attach an existing competency from the inventory into this career track.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              <form onSubmit={handleAttachSkill} className="space-y-3.5">
                {/* Select Skill */}
                <div className="space-y-1.5">
                  <Label htmlFor="attach-skill-select" className="text-xs font-semibold">
                    Available Skill <span className="text-destructive">*</span>
                  </Label>
                  <Select value={newSkillId} onValueChange={setNewSkillId}>
                    <SelectTrigger id="attach-skill-select" className="text-xs">
                      <SelectValue placeholder="Choose skill to attach..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {availableSkills.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                          All available skills are already assigned to this pathway.
                        </div>
                      ) : (
                        availableSkills.map((s) => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">
                            {s.title} ({s.domain} • {s.difficulty})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stage Tier */}
                <div className="space-y-1.5">
                  <Label htmlFor="attach-tier" className="text-xs font-semibold">
                    Stage Tier (Curriculum Phase)
                  </Label>
                  <Select
                    value={String(newTier)}
                    onValueChange={(v) => setNewTier(parseInt(v, 10))}
                  >
                    <SelectTrigger id="attach-tier" className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Stage 1: Core Fundamentals</SelectItem>
                      <SelectItem value="2">Stage 2: Applied Systems</SelectItem>
                      <SelectItem value="3">Stage 3: Executive Leadership</SelectItem>
                      <SelectItem value="4">Stage 4: Specialized Master</SelectItem>
                      <SelectItem value="5">Stage 5: Plant Governance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Index */}
                <div className="space-y-1.5">
                  <Label htmlFor="attach-order" className="text-xs font-semibold">
                    Display Order Index
                  </Label>
                  <Input
                    id="attach-order"
                    type="number"
                    min={0}
                    value={newOrder}
                    onChange={(e) => setNewOrder(parseInt(e.target.value, 10) || 0)}
                    className="text-xs"
                  />
                </div>

                {/* Core vs Elective */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-muted/20">
                  <div>
                    <Label htmlFor="attach-core" className="text-xs font-semibold cursor-pointer">
                      Core Requirement
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      {newIsCore ? "Mandatory for this career pathway" : "Optional / Elective module"}
                    </p>
                  </div>
                  <Switch
                    id="attach-core"
                    checked={newIsCore}
                    onCheckedChange={setNewIsCore}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full text-xs font-semibold mt-2"
                  disabled={isAttaching || !newSkillId || availableSkills.length === 0}
                >
                  {isAttaching && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Assign to Pathway
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
              <AlertDialogTitle>Unlink Skill from Pathway?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground">
              <p>
                Are you sure you want to remove{" "}
                <strong className="text-foreground">"{mappingToDelete?.title}"</strong> from{" "}
                <strong className="text-foreground">{activePath?.title}</strong>?
              </p>
              <p className="text-xs text-muted-foreground">
                This removes the curriculum assignment only. The skill, its courses, and mentors
                will remain in the system.
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
              Remove Assignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
