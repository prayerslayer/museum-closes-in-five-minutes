import Phaser from "phaser";
import { VISITOR_VELOCITY, SCALE_FACTOR, TILE_SIZE } from "./config";
import { VisitorState, GoAction, VisitorFSM, VisitorAction } from "./states";

const visitorActions = [
  VisitorAction.StartMoving,
  VisitorAction.StopMoving,
  VisitorAction.FindPainting
];

export default class Visitor extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, everything) {
    super(scene, x, y);
    this.everything = everything; // this sucks
    this.setData({
      state: VisitorState.Idle,
      last_state_change: Date.now() - 3000
    });
  }

  stateTransition() {
    const v = this;
    const currentState = v.getData("state");
    // TODO solve with timer events
    if (Date.now() - v.getData("last_state_change") > 3000) {
      const action = Phaser.Math.RND.weightedPick(visitorActions);
      const newState = VisitorFSM.transition(currentState, action).value;
      return newState;
    } else {
      return v.getData("state");
    }
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    const v = this;
    const newState = this.stateTransition();
    const currentState = v.getData("state");

    if (newState === currentState) {
      return;
    }

    const { pathfinder, layer, paintingTiles } = this.everything;

    switch (newState) {
      case VisitorState.Idle:
        v.setVelocityX(0);
        v.setVelocityY(0);
        v.anims.play("idle", true);
        break;
      case VisitorState.GoingToPainting: {
        this.setTint(0xff0000);
        const dst = Phaser.Math.RND.weightedPick(paintingTiles);
        const src = layer.getTileAtWorldXY(v.x, v.y);
        v.animateTo(pathfinder.findPath(src, dst));
        break;
      }
      case VisitorState.RandomlyMoving:
        {
          this.setTint(0x00ff00);
          const direction = Phaser.Math.RND.weightedPick(Object.keys(GoAction));
          const xDir =
            direction == GoAction.GoLeft
              ? -1
              : direction === GoAction.GoRight
                ? 1
                : 0;
          const yDir =
            direction == GoAction.GoUp
              ? -1
              : direction === GoAction.GoDown
                ? 1
                : 0;
          v.setVelocityX(VISITOR_VELOCITY * xDir);
          v.setVelocityY(VISITOR_VELOCITY * yDir);
          if (xDir > 0) {
            v.anims.play("walk_right", true);
          } else {
            v.anims.play("walk_left", true);
          }
        }
        break;
    }
    v.setData({
      state: newState,
      last_state_change: Date.now()
    });
  }

  animateTo(path) {
    const v = this;
    const scene = v.scene;
    if (path.length < 2) {
      if (v.getData("state") === VisitorState.GoingToPainting) {
        const newState = VisitorFSM.transition(
          VisitorState.GoingToPainting,
          VisitorAction.FoundPainting
        ).value;
        v.setData({
          state: newState,
          last_state_change: Date.now()
        });
      }
      v.anims.play("idle");
      return;
    }
    const tweens = [];
    const { layer } = this.everything;

    for (let i = 1; i < path.length; i++) {
      const previous = path[i - 1];
      const current = path[i];
      const { x: px } = layer.tileToWorldXY(previous[0], previous[1]);
      const { x, y } = layer.tileToWorldXY(current[0], current[1]);
      const left = x - px < 0;
      const duration =
        Math.sqrt(
          Math.pow(current[0] - previous[0], 2) +
            Math.pow(current[1] - previous[1], 2)
        ) *
        (3 / 2) *
        SCALE_FACTOR *
        VISITOR_VELOCITY;

      tweens.push({
        targets: v,
        x,
        y,
        duration,
        onStart: () =>
          left
            ? v.anims.play("walk_left", true)
            : v.anims.play("walk_right", true)
      });
    }

    for (let i = 0; i < tweens.length; i++) {
      tweens[i].onComplete = () => {
        if (i === tweens.length - 1) {
          const newState = VisitorFSM.transition(
            VisitorState.GoingToPainting,
            VisitorAction.FoundPainting
          ).value;
          v.setData({
            state: newState,
            last_state_change: Date.now()
          });
          v.anims.play("idle");
        } else {
          scene.tweens.add(tweens[i + 1]);
        }
      };
    }
    scene.tweens.add(tweens[0]);
  }
}
