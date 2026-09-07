// Client-safe step-grouping helper. Deliberately has no server-only imports
// (unlike tutorial-store.ts, which pulls in firebase-admin) so it can be
// imported as a value from client components.
import type { Step } from "./tutorial-store";

export type StepGroup = {
  main: Step;
  subSteps: Step[];
};

// Groups a flat, order-sorted step list into main-step blocks. Steps missing
// stepType/parentStepId (pre-migration content) are treated as main steps.
export function groupSteps(steps: Step[]): StepGroup[] {
  const groups: StepGroup[] = [];
  const groupByParentId = new Map<string, StepGroup>();

  for (const step of steps) {
    if (step.stepType === "sub" && step.parentStepId && groupByParentId.has(step.parentStepId)) {
      groupByParentId.get(step.parentStepId)!.subSteps.push(step);
    } else {
      const group: StepGroup = { main: step, subSteps: [] };
      groups.push(group);
      groupByParentId.set(step.id, group);
    }
  }

  return groups;
}
