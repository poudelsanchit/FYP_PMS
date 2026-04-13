"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import { EditorToolbar } from "./EditorToolbar";

interface TiptapEditorProps {
  content: string; // Tiptap JSON string
  onChange: (content: string) => void;
  placeholder?: string;
}

/**
 * Parse content string to Tiptap document format
 * Handles empty strings and invalid JSON gracefully
 */
function parseContent(content: string): object {
  if (!content || content.trim() === "") {
    return { type: "doc", content: [] };
  }

  try {
    const parsed = JSON.parse(content);
    // Validate basic structure
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return parsed;
    }
    return { type: "doc", content: [] };
  } catch {
    return { type: "doc", content: [] };
  }
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: parseContent(content),
    onUpdate: ({ editor }) => {
      // Serialize editor content to Tiptap JSON string
      const json = editor.getJSON();
      onChange(JSON.stringify(json));
    },
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[400px]",
      },
    },
  });

  // Update editor content when prop changes externally
  useEffect(() => {
    if (editor && content) {
      const currentContent = JSON.stringify(editor.getJSON());
      if (currentContent !== content) {
        const parsedContent = parseContent(content);
        editor.commands.setContent(parsedContent);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg bg-background shadow-sm">
      <EditorToolbar editor={editor} />
      <div className="prose prose-sm sm:prose lg:prose-lg max-w-none p-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
