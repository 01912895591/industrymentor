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
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Trash2,
  Compass,
  FileText,
  Loader2,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import type { SkillRow, SkillLibraryItemRow, LibraryItemOption } from "@/hooks/useCareer";

interface SkillLibraryTabProps {
  skills: SkillRow[];
  skillLibraryItems: SkillLibraryItemRow[];
  libraryItems: LibraryItemOption[];
  selectedSkillId?: string;
  onSelectSkillId?: (id: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

const RESOURCE_ROLES = [
  { value: "handbook", label: "Handbook (Standard Technical Manual)" },
  { value: "calculation_tool", label: "Calculation Tool (Formula / Excel Template)" },
  { value: "reference_guide", label: "Reference Guide (Standards & Norms)" },
  { value: "sop_template", label: "SOP Template (Factory Floor Procedure)" },
];

export function SkillLibraryTab({
  skills,
  skillLibraryItems,
  libraryItems,
  selectedSkillId,
  onSelectSkillId,
  isLoading,
  onRefresh,
}: SkillLibraryTabProps) {
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

  // Attached library items
  const attachedItems = useMemo(() => {
    return skillLibraryItems
      .filter((sli) => sli.skill_id === activeSkillId)
      .map((sli) => {
        const item = libraryItems.find((li) => li.id === sli.library_item_id);
        return {
          ...sli,
          item,
        };
      })
      .sort((a, b) => a.order_index - b.order_index);
  }, [skillLibraryItems, activeSkillId, libraryItems]);

  // Available library items not yet attached
  const availableItems = useMemo(() => {
    const attachedIds = new Set(
      skillLibraryItems.filter((sli) => sli.skill_id === activeSkillId).map((sli) => sli.library_item_id)
    );
    return libraryItems.filter((li) => !attachedIds.has(li.id));
  }, [libraryItems, skillLibraryItems, activeSkillId]);

  // Form states
  const [newItemId, setNewItemId] = useState("");
  const [newRole, setNewRole] = useState("handbook");
  const [newOrder, setNewOrder] = useState(1);
  const [isAttaching, setIsAttaching] = useState(false);

  // Remove confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<{
    skillId: string;
    libraryItemId: string;
    title: string;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const handleSelectSkill = (id: string) => {
    setActiveSkillId(id);
    onSelectSkillId?.(id);
    setNewItemId("");
  };

  const handleAttachItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSkillId || !newItemId) {
      toast({ title: "Please choose a library item to link", variant: "destructive" });
      return;
    }

    setIsAttaching(true);
    try {
      const payload = {
        skill_id: activeSkillId,
        library_item_id: newItemId,
        resource_role: newRole,
        order_index: Number(newOrder),
      };

      const { error } = await supabase.from("skill_library_items").insert([payload]);
      if (error) throw error;

      toast({
        title: "Library Resource Linked",
        description: "Technical handbook assigned to skill successfully.",
      });
      setNewItemId("");
      setNewOrder(attachedItems.length + 2);
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Link Failed",
        description: err.message || "Failed to link library resource.",
        variant: "destructive",
      });
    } finally {
      setIsAttaching(false);
    }
  };

  const handleRoleChange = async (mapping: SkillLibraryItemRow, newRoleVal: string) => {
    setBusyItemId(mapping.library_item_id);
    try {
      const { error } = await supabase
        .from("skill_library_items")
        .update({ resource_role: newRoleVal })
        .match({ skill_id: mapping.skill_id, library_item_id: mapping.library_item_id });

      if (error) throw error;
      toast({ title: "Resource Role Updated" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setBusyItemId(null);
    }
  };

  const handleOrderChange = async (mapping: SkillLibraryItemRow, newOrderVal: number) => {
    if (newOrderVal < 0) return;
    setBusyItemId(mapping.library_item_id);
    try {
      const { error } = await supabase
        .from("skill_library_items")
        .update({ order_index: newOrderVal })
        .match({ skill_id: mapping.skill_id, library_item_id: mapping.library_item_id });

      if (error) throw error;
      toast({ title: "Order Index Updated" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setBusyItemId(null);
    }
  };

  const confirmRemove = async () => {
    if (!mappingToDelete) return;
    setIsRemoving(true);
    try {
      const { error } = await supabase
        .from("skill_library_items")
        .delete()
        .match({
          skill_id: mappingToDelete.skillId,
          library_item_id: mappingToDelete.libraryItemId,
        });

      if (error) throw error;
      toast({
        title: "Resource Unlinked",
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

  const formatRoleLabel = (role: string | null) => {
    switch (role) {
      case "handbook":
        return "Technical Handbook";
      case "calculation_tool":
        return "Calculation Tool";
      case "reference_guide":
        return "Reference Guide";
      case "sop_template":
        return "SOP Template";
      default:
        return role || "Reference";
    }
  };

  return (
    <div className="space-y-4">
      {/* Skill Selector */}
      <Card className="border-border/60 bg-card/40">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
              <FileText className="h-5 w-5" />
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
                {attachedItems.length} Library Resources Linked
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Attached Resources */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="p-4 bg-muted/20 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Handbook Resources for {activeSkill?.title || "Skill"}</span>
                <Badge variant="secondary" className="text-xs">
                  {attachedItems.length} Resources
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Real technical handbooks and SOPs from <code>public.library_items</code> backing this competency.
              </CardDescription>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="w-16 text-center">Order</TableHead>
                    <TableHead>Resource Title & Category</TableHead>
                    <TableHead className="w-44">Resource Role</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attachedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                        No technical library items linked to this competency yet. Use the form on the right to attach resources.
                      </TableCell>
                    </TableRow>
                  ) : (
                    attachedItems.map((mapping) => {
                      const isBusy = busyItemId === mapping.library_item_id;
                      const item = mapping.item;

                      return (
                        <TableRow key={mapping.library_item_id} className="hover:bg-muted/20">
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

                          {/* Resource Info */}
                          <TableCell>
                            <div className="font-medium text-sm text-foreground flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                              <span>{item?.title || mapping.library_item_id}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px] uppercase font-mono py-0">
                                {item?.item_type || "Resource"}
                              </Badge>
                              {item?.category && (
                                <span className="text-[11px] text-muted-foreground">
                                  {item.category}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Role Selector */}
                          <TableCell>
                            <Select
                              value={mapping.resource_role || "handbook"}
                              onValueChange={(val) => handleRoleChange(mapping, val)}
                              disabled={isBusy}
                            >
                              <SelectTrigger className="h-7 text-xs w-44">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RESOURCE_ROLES.map((r) => (
                                  <SelectItem key={r.value} value={r.value} className="text-xs">
                                    {r.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                                  libraryItemId: mapping.library_item_id,
                                  title: item?.title || "this resource",
                                });
                                setDeleteDialogOpen(true);
                              }}
                              title="Unlink resource"
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

        {/* Right 1 Col: Attach Resource Form */}
        <div className="space-y-3">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="p-4 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-rose-400" />
                Attach Library Handbook
              </CardTitle>
              <CardDescription className="text-xs">
                Link real publications from <code>public.library_items</code>.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              <form onSubmit={handleAttachItem} className="space-y-3.5">
                {/* Select Item */}
                <div className="space-y-1.5">
                  <Label htmlFor="attach-lib-select" className="text-xs font-semibold">
                    Select Resource <span className="text-destructive">*</span>
                  </Label>
                  <Select value={newItemId} onValueChange={setNewItemId}>
                    <SelectTrigger id="attach-lib-select" className="text-xs">
                      <SelectValue placeholder="Choose handbook..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {availableItems.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                          All available library items are already linked to this skill.
                        </div>
                      ) : (
                        availableItems.map((li) => (
                          <SelectItem key={li.id} value={li.id} className="text-xs">
                            {li.title} ({li.item_type.toUpperCase()})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Resource Role */}
                <div className="space-y-1.5">
                  <Label htmlFor="resource-role" className="text-xs font-semibold">
                    Technical Resource Role
                  </Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger id="resource-role" className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value} className="text-xs">
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Index */}
                <div className="space-y-1.5">
                  <Label htmlFor="lib-order" className="text-xs font-semibold">
                    Display Order Index
                  </Label>
                  <Input
                    id="lib-order"
                    type="number"
                    min={0}
                    value={newOrder}
                    onChange={(e) => setNewOrder(parseInt(e.target.value, 10) || 0)}
                    className="text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full text-xs font-semibold mt-2"
                  disabled={isAttaching || !newItemId || availableItems.length === 0}
                >
                  {isAttaching && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Attach Resource to Skill
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
              <AlertDialogTitle>Unlink Resource from Skill?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground">
              <p>
                Are you sure you want to unlink{" "}
                <strong className="text-foreground">"{mappingToDelete?.title}"</strong> from{" "}
                <strong className="text-foreground">{activeSkill?.title}</strong>?
              </p>
              <p className="text-xs text-muted-foreground">
                This unlinks the resource from this skill. The publication record itself is unaffected.
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
              Unlink Resource
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
