import type { DesktopWindow } from "./main.ts";

/**
 * Stub binding surface so main.ts wires up in Phase A.
 * The full §7.4 contract (app, library, values, shells, execution,
 * filesystem, hub, publish, settings) lands in Phase C (task C6).
 */
export function registerBindings(_win: DesktopWindow): void {
  // No-op until C6.
}
