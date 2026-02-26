"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { Button } from "@/core/components/ui/button";

interface EmojiPickerProps {
  emoji: string;
  onChange: (emoji: string) => void;
  disabled?: boolean;
}

// Common emojis for documentation
const COMMON_EMOJIS = [
  "📄", "📝", "📋", "📌", "📍", "📎", "📁", "📂", "📊", "📈",
  "📉", "📦", "📚", "📖", "📗", "📘", "📙", "📕", "🔖", "🏷️",
  "💡", "🔍", "🔎", "🔧", "🔨", "⚙️", "🛠️", "⚡", "🔥", "✨",
  "⭐", "🌟", "💫", "🎯", "🎨", "🎭", "🎪", "🎬", "🎮", "🎲",
  "🚀", "🛸", "🌈", "🌍", "🌎", "🌏", "🗺️", "🧭", "🏁", "🚩",
  "✅", "❌", "⚠️", "🚫", "💯", "🔔", "🔕", "📢", "📣", "💬",
];

export function EmojiPicker({ emoji, onChange, disabled = false }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleEmojiSelect = (selectedEmoji: string) => {
    onChange(selectedEmoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-16 w-16 text-4xl hover:bg-gray-100 rounded-lg"
          disabled={disabled}
        >
          {emoji}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="grid grid-cols-8 gap-2">
          {COMMON_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => handleEmojiSelect(e)}
              className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
              type="button"
            >
              {e}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
