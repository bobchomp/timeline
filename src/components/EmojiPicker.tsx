"use client";

import { EMOJI_LIST } from "@/types/timeline";

interface EmojiPickerProps {
  selected: string;
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-200">
      {EMOJI_LIST.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={`
            text-2xl h-10 w-full flex items-center justify-center rounded-lg
            transition-all duration-150 hover:scale-110
            ${selected === emoji
              ? "bg-purple-100 ring-2 ring-purple-400 scale-110"
              : "hover:bg-gray-200"
            }
          `}
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
