import Phaser from "phaser";
import { VISITOR_VELOCITY, SCALE_FACTOR, DEBUG } from "./config";
import { VisitorState, VisitorFSM, VisitorAction } from "./states";

const visitorActions = [VisitorAction.StartMoving, VisitorAction.FindPainting];

export default class Visitor extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, everything) {
    super(scene, x, y);
    this.name = Math.floor(Math.random() * 100) + "";
    this.everything = everything; // this sucks
    this.setData({
      state: VisitorState.Idle,
      last_state_change: Date.now() - 3000
    });
  }

  walkLeft() {
    this.flipX = true;
    this.anims.play("walk_x", true);
  }
  walkRight() {
    this.flipX = false;
    this.anims.play("walk_x", true);
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
    const currentState = v.getData("state");

    v.depth = v.y;
    if (DEBUG) {
      v.setTint(
        {
          [VisitorState.Idle]: 0xffffff,
          [VisitorState.GoingToPainting]: 0xff0000,
          [VisitorState.RandomlyMoving]: 0x00ff00
        }[currentState]
      );
    }

    if (currentState !== VisitorState.Idle) {
      return;
    } else {
      v.setVelocityX(0);
      v.setVelocityY(0);
      v.anims.play("idle", true);
    }

    const newState = this.stateTransition();
    if (newState === currentState) {
      return;
    }

    const { pathfinder, layer, paintingTiles } = this.everything;

    v.setData({
      state: newState,
      last_state_change: Date.now()
    });
    switch (newState) {
      case VisitorState.GoingToPainting: {
        const dst = Phaser.Math.RND.weightedPick(paintingTiles);
        const src = layer.getTileAtWorldXY(v.x, v.y);
        // TODO if there's no immediate path they idle forever
        v.animateTo(pathfinder.findPath(src, dst));
        break;
      }
      case VisitorState.RandomlyMoving: {
        const src = layer.getTileAtWorldXY(v.x, v.y);
        v.animateTo(
          pathfinder.findPath(src, pathfinder.getRandomWalkableTile([src]))
        );
        break;
      }
    }
  }

  animateTo(path) {
    const v = this;
    const scene = v.scene;
    if (path.length < 2) {
      if (v.getData("state") === VisitorState.RandomlyMoving) {
        const newState = VisitorFSM.transition(
          VisitorState.RandomlyMoving,
          VisitorAction.StopMoving
        ).value;
        v.setData({
          state: newState,
          last_state_change: Date.now()
        });
      }
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
        onStart: () => {
          if (left) {
            this.walkLeft();
          } else {
            this.walkRight();
          }
        }
      });
    }

    for (let i = 0; i < tweens.length; i++) {
      tweens[i].onComplete = () => {
        if (i === tweens.length - 1) {
          if (v.getData("state") === VisitorState.RandomlyMoving) {
            const newState = VisitorFSM.transition(
              VisitorState.RandomlyMoving,
              VisitorAction.StopMoving
            ).value;
            v.setData({
              state: newState,
              last_state_change: Date.now()
            });
          }
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
        } else {
          scene.tweens.add(tweens[i + 1]);
        }
      };
    }
    scene.tweens.add(tweens[0]);
  }
}
