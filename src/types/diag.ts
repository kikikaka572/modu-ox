export type DiagCheckId = "rest" | "realtime" | "broadcast";

export type DiagCheckState =
  | { status: "pending" }
  | { status: "running" }
  | { status: "success"; detail?: string }
  | { status: "fail"; reason: string };

export interface DiagCheckDef {
  id: DiagCheckId;
  label: string;
  description: string;
}
