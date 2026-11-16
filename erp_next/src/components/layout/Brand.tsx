import { APP_NAME } from "@/config/app";

export function Brand() {
  return (
    <div className="border-b border-line bg-panel px-4 py-3">
      <span className="text-2xl font-bold italic tracking-tight text-accent">{APP_NAME}</span>
    </div>
  );
}
