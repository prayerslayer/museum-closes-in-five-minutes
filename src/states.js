import { Machine } from "xstate";
export const VisitorState = {
  Idle: "Idle",
  RandomlyMoving: "RandomlyMoving",
  GoingToPainting: "GoingToPainting"
};
export const VisitorAction = {
  FindPainting: "FindPainting",
  StartMoving: "StartMoving",
  StopMoving: "StopMoving",
  FoundPainting: "FoundPainting"
};
export const GoAction = {
  GoLeft: "GoLeft",
  GoRight: "GoRight",
  GoUp: "GoUp",
  GoDown: "GoDown"
};

export const VisitorFSM = Machine({
  initial: VisitorState.Idle,
  states: {
    [VisitorState.Idle]: {
      on: {
        [VisitorAction.StartMoving]: VisitorState.RandomlyMoving,
        [VisitorAction.FindPainting]: VisitorState.GoingToPainting
      }
    },
    [VisitorState.RandomlyMoving]: {
      on: {
        [VisitorAction.StopMoving]: VisitorState.Idle
      }
    },
    [VisitorState.GoingToPainting]: {
      on: {
        // Visitor will get to this fucking painting no matter what it takes
        [VisitorAction.FoundPainting]: VisitorState.Idle
      }
    }
  }
});
