import { AuthSwitchLink } from "./AuthSwitchLink";
import { SystemMenu } from "./SystemMenu";

export function TopBar() {
  return (
    <header className="border-b border-line bg-shell text-shell-fg">
      <nav aria-label="Application menu" className="flex h-9 items-center gap-1 px-2">
        <AuthSwitchLink />
        <SystemMenu />
      </nav>
    </header>
  );
}
