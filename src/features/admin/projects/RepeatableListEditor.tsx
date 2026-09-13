import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type {
  ProjectDeliverable,
  ProjectEvaluationCriterion,
  ProjectResource,
} from "@/types/projects";

// ==========================================
// 1. Objectives Editor (Array of strings)
// ==========================================
interface ObjectivesEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
}

export function ObjectivesEditor({ items, onChange }: ObjectivesEditorProps) {
  const handleAdd = () => {
    onChange([...items, ""]);
  };

  const handleUpdate = (index: number, val: string) => {
    const updated = [...items];
    updated[index] = val;
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">Learning Objectives</Label>
          <p className="text-xs text-muted-foreground">
            Clear competencies and capabilities students master upon project completion.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="h-8 gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Objective
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
          No learning objectives added yet. Click &quot;Add Objective&quot; to define project outcomes.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 p-2"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-muted/60 text-xs font-semibold text-muted-foreground">
                {index + 1}
              </span>
              <Input
                value={item}
                onChange={(e) => handleUpdate(index, e.target.value)}
                placeholder="e.g. Construct an accurate tech pack and bill of materials (BOM)"
                className="h-8 flex-1 text-sm"
                aria-label={`Learning Objective ${index + 1}`}
              />
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  disabled={index === 0}
                  onClick={() => handleMove(index, "up")}
                  aria-label="Move objective up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                  <span className="sr-only">Move up</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  disabled={index === items.length - 1}
                  onClick={() => handleMove(index, "down")}
                  aria-label="Move objective down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                  <span className="sr-only">Move down</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(index)}
                  aria-label="Delete objective"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. Deliverables Editor
// ==========================================
interface DeliverablesEditorProps {
  items: ProjectDeliverable[];
  onChange: (items: ProjectDeliverable[]) => void;
}

export function DeliverablesEditor({ items, onChange }: DeliverablesEditorProps) {
  const handleAdd = () => {
    onChange([...items, { title: "", format: "PDF / Excel", description: "" }]);
  };

  const handleUpdate = (index: number, field: keyof ProjectDeliverable, val: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">Expected Deliverables</Label>
          <p className="text-xs text-muted-foreground">
            Tangible work products students must upload or submit for mentor evaluation.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="h-8 gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Deliverable
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
          No deliverables specified. Click &quot;Add Deliverable&quot; to define submission artifacts.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="relative space-y-2 rounded-lg border border-border/50 bg-card/40 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={item.title}
                    onChange={(e) => handleUpdate(index, "title", e.target.value)}
                    placeholder="Deliverable Title (e.g. Line Balancing Simulation Worksheet)"
                    className="h-8 text-sm font-medium"
                    aria-label={`Deliverable ${index + 1} title`}
                  />
                  <Input
                    value={item.format || ""}
                    onChange={(e) => handleUpdate(index, "format", e.target.value)}
                    placeholder="Format (e.g. Excel / PDF / Video)"
                    className="h-8 w-44 text-xs"
                    aria-label={`Deliverable ${index + 1} format`}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    disabled={index === 0}
                    onClick={() => handleMove(index, "up")}
                    aria-label="Move deliverable up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    <span className="sr-only">Move up</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    disabled={index === items.length - 1}
                    onClick={() => handleMove(index, "down")}
                    aria-label="Move deliverable down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                    <span className="sr-only">Move down</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(index)}
                    aria-label="Delete deliverable"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
              <Textarea
                value={item.description || ""}
                onChange={(e) => handleUpdate(index, "description", e.target.value)}
                placeholder="Describe required contents, templates to follow, or constraints..."
                className="h-16 text-xs resize-none"
                aria-label={`Deliverable ${index + 1} description`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. Evaluation Criteria Editor
// ==========================================
interface CriteriaEditorProps {
  items: ProjectEvaluationCriterion[];
  onChange: (items: ProjectEvaluationCriterion[]) => void;
}

export function EvaluationCriteriaEditor({ items, onChange }: CriteriaEditorProps) {
  const handleAdd = () => {
    onChange([...items, { criterion: "", weight: "25%", description: "" }]);
  };

  const handleUpdate = (index: number, field: keyof ProjectEvaluationCriterion, val: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">Evaluation Rubric & Criteria</Label>
          <p className="text-xs text-muted-foreground">
            Grading dimensions mentors use to review, score, and approve student work.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="h-8 gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Criterion
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
          No evaluation criteria added. Click &quot;Add Criterion&quot; to build the assessment rubric.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="space-y-2 rounded-lg border border-border/50 bg-card/40 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/20 text-xs font-bold text-amber-500">
                  {index + 1}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={item.criterion}
                    onChange={(e) => handleUpdate(index, "criterion", e.target.value)}
                    placeholder="Criterion (e.g. Standard Minute Value (SMV) Accuracy)"
                    className="h-8 text-sm font-medium"
                    aria-label={`Criterion ${index + 1} name`}
                  />
                  <Input
                    value={item.weight || ""}
                    onChange={(e) => handleUpdate(index, "weight", e.target.value)}
                    placeholder="Weight (e.g. 30%)"
                    className="h-8 w-28 text-xs font-semibold"
                    aria-label={`Criterion ${index + 1} weight`}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    disabled={index === 0}
                    onClick={() => handleMove(index, "up")}
                    aria-label="Move criterion up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    <span className="sr-only">Move up</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    disabled={index === items.length - 1}
                    onClick={() => handleMove(index, "down")}
                    aria-label="Move criterion down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                    <span className="sr-only">Move down</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(index)}
                    aria-label="Delete criterion"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
              <Textarea
                value={item.description || ""}
                onChange={(e) => handleUpdate(index, "description", e.target.value)}
                placeholder="What distinguishes excellent vs acceptable industry standard execution..."
                className="h-16 text-xs resize-none"
                aria-label={`Criterion ${index + 1} description`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. Resources Editor
// ==========================================
interface ResourcesEditorProps {
  items: ProjectResource[];
  onChange: (items: ProjectResource[]) => void;
}

export function ResourcesEditor({ items, onChange }: ResourcesEditorProps) {
  const handleAdd = () => {
    onChange([...items, { title: "", type: "Template", url: "", notes: "" }]);
  };

  const handleUpdate = (index: number, field: keyof ProjectResource, val: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">Reference Resources & Toolkits</Label>
          <p className="text-xs text-muted-foreground">
            SOPs, sample datasets, Tech Pack spreadsheets, or standard reference guides.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="h-8 gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Resource
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
          No external resources linked. Click &quot;Add Resource&quot; if templates or docs are needed.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="space-y-2 rounded-lg border border-border/50 bg-card/40 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={item.title}
                  onChange={(e) => handleUpdate(index, "title", e.target.value)}
                  placeholder="Resource Title (e.g. Standard SAM Calculation Sheet)"
                  className="h-8 flex-1 text-sm font-medium"
                  aria-label={`Resource ${index + 1} title`}
                />
                <Input
                  value={item.type || ""}
                  onChange={(e) => handleUpdate(index, "type", e.target.value)}
                  placeholder="Type (e.g. Template, SOP)"
                  className="h-8 w-32 text-xs"
                  aria-label={`Resource ${index + 1} type`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(index)}
                  aria-label="Delete resource"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  value={item.url || ""}
                  onChange={(e) => handleUpdate(index, "url", e.target.value)}
                  placeholder="URL (https://... or documentation link)"
                  className="h-8 text-xs font-mono"
                  aria-label={`Resource ${index + 1} URL`}
                />
                <Input
                  value={item.notes || ""}
                  onChange={(e) => handleUpdate(index, "notes", e.target.value)}
                  placeholder="Instructions for using this resource..."
                  className="h-8 text-xs"
                  aria-label={`Resource ${index + 1} notes`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
