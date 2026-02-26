"use client";

import { Input } from "@/core/components/ui/input";

interface TitleInputProps {
  title: string;
  onChange: (title: string) => void;
  disabled?: boolean;
}

export function TitleInput({ title, onChange, disabled = false }: TitleInputProps) {
  return (
    <Input
      type="text"
      value={title}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Untitled Document"
      disabled={disabled}
      className="text-4xl font-bold border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-2"
    />
  );
}
