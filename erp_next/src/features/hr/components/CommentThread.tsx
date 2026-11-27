"use client";

import { useState, type FormEvent } from "react";
import type { HrComment } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/date";

type Props = {
  /** Used to name the field for screen readers, e.g. "goal G-001". */
  label: string;
  comments: HrComment[];
  onAdd: (text: string) => void;
  placeholder?: string;
};

/** Newest-first list of comments with a text bar to add one. */
export function CommentThread({ label, comments, onAdd, placeholder = "Write a comment" }: Props) {
  const [text, setText] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    onAdd(value);
    setText("");
  };

  return (
    <div>
      <form onSubmit={submit} className="flex items-center gap-2">
        <label htmlFor={`comment-${label}`} className="sr-only">
          Comment on {label}
        </label>
        <Input id={`comment-${label}`} controlSize="sm" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} />
        <Button type="submit" size="sm" variant="secondary" disabled={!text.trim()}>
          Add comment
        </Button>
      </form>
      {comments.length > 0 && (
        <ul className="mt-3 space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <p>
                <span className="font-medium">{c.by}</span>
                <span className="text-xs text-ink-muted"> · {formatDate(c.at)}</span>
              </p>
              <p>{c.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
