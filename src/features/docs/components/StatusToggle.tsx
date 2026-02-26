"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import type { DocStatus } from "../types/doc.types";

interface StatusToggleProps {
  status: DocStatus;
  onChange: (status: DocStatus) => void;
  disabled?: boolean;
}

export function StatusToggle({ status, onChange, disabled = false }: StatusToggleProps) {
  return (
    <Select
      value={status}
      onValueChange={(value) => onChange(value as DocStatus)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft">Draft</SelectItem>
        <SelectItem value="published">Published</SelectItem>
      </SelectContent>
    </Select>
  );
}
