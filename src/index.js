import Phaser from "phaser";
import sortBy from "lodash-es/sortBy";
import PLAYER from "./assets/img/walk_right.png";
import WALLS from "./assets/img/walls.png";
import MUSEUM from "./assets/map/room.csv";
import paintings from "./paintings";
import { Machine } from "xstate";

const SCALE_FACTOR = 4;
const PLAYER_VELOCITY = 80 * SCALE_FACTOR;
const VISITOR_VELOCITY = 20 * SCALE_FACTOR;

const VisitorState = {
  Idle: "Idle",
  RandomlyMoving: "RandomlyMoving",
  GoingToPainting: "GoingToPainting"
};
const VisitorAction = {
  FindPainting: "FindPainting",
  StartMoving: "StartMoving",
  StopMoving: "StopMoving",
  FoundPainting: "FoundPainting"
};
const Direction = {
  GoLeft: "GoLeft",
  GoRight: "GoRight",
  GoUp: "GoUp",
  GoDown: "GoDown"
};
const visitorFSM = Machine({
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
var config = {
  type: Phaser.AUTO,
  width: 640,
  height: 480,
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: false
      // debug: true
    }
  },
  scene: {
    preload,
    update,
    create
  }
};

var game = new Phaser.Game(config);
var player;
var visitors = [];
var layer;
var text;
var score = 0;
var cursors;
var map;

function preload() {
  this.load.spritesheet("player", PLAYER, {
    frameWidth: 16,
    frameHeight: 16,
    scale: SCALE_FACTOR
  });
  this.load.spritesheet("walls", WALLS, {
    frameWidth: 16,
    frameHeight: 16
  });
  paintings.forEach(painting => this.load.image(painting, painting));
  this.load.tilemapCSV("museum", MUSEUM);
}

function updatePlayer() {
  const anyDown =
    cursors.left.isDown ||
    cursors.right.isDown ||
    cursors.up.isDown ||
    cursors.down.isDown;

  if (cursors.left.isDown) {
    player.setVelocityX(-PLAYER_VELOCITY);
    player.anims.play("walk_left", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(PLAYER_VELOCITY);
    player.anims.play("walk_right", true);
  } else {
    player.setVelocityX(0);
  }

  player.depth = player.y;

  if (cursors.up.isDown) {
    player.setVelocityY(-PLAYER_VELOCITY);
  } else if (cursors.down.isDown) {
    player.setVelocityY(PLAYER_VELOCITY);
  } else {
    player.setVelocityY(0);
  }

  if (!anyDown) {
    player.anims.play("idle");
  }
}

function checkOverlapWithPainting() {
  const tile = layer.getTileAtWorldXY(player.x, player.y);
  if (tile.index === PAINTING_TILE && !tile.properties.visited) {
    tile.properties.visited = true;
    score += tile.properties.attractiveness;
    tile.properties.image.setTint(0xaaaaaa);
  }
}

function updateText() {
  text.setText("Score: " + score);
}

const visitorActions = [
  VisitorAction.FindPainting,
  VisitorAction.StartMoving,
  VisitorAction.StopMoving
];

function visitorStateTransition(v) {
  const currentState = v.getData("state");
  if (Date.now() - v.getData("last_state_change") > 3000) {
    const action = Phaser.Math.RND.weightedPick(visitorActions);
    const newState = visitorFSM.transition(currentState, action).value;
    return newState;
  } else {
    return v.getData("state");
  }
}

function moveVisitors(dis) {
  visitors.children.iterate(v => {
    const newState = visitorStateTransition(v);
    const currentState = v.getData("state");
    if (newState !== currentState) {
      switch (newState) {
        case VisitorState.Idle:
          v.setVelocityX(0);
          v.setVelocityY(0);
          v.anims.play("idle", true);
          break;
        case VisitorState.GoingToPainting:
          {
            const tile = Phaser.Math.RND.weightedPick(paintingTiles);
            const { x, y } = layer.tileToWorldXY(tile.x, tile.y);
            dis.tweens.add({
              targets: v,
              x: x + Phaser.Math.Between(0, 32),
              y: y + 32,
              duration: 6000,
              onStart: () => v.anims.play("walk_right"),
              onComplete: () => {
                const newState = visitorFSM.transition(
                  VisitorState.GoingToPainting,
                  VisitorAction.FoundPainting
                ).value;
                v.setData({
                  state: newState,
                  last_state_change: Date.now()
                });
                v.anims.play("idle");
              }
            });
          }
          break;
        case VisitorState.RandomlyMoving:
          {
            const direction = Phaser.Math.RND.weightedPick(
              Object.keys(Direction)
            );
            const xDir =
              direction == Direction.GoLeft
                ? -1
                : direction === Direction.GoRight
                  ? 1
                  : 0;
            const yDir =
              direction == Direction.GoUp
                ? -1
                : direction === Direction.GoDown
                  ? 1
                  : 0;
            v.setVelocityX(VISITOR_VELOCITY * xDir);
            v.setVelocityY(VISITOR_VELOCITY * yDir);
            if (xDir > 0) {
              v.anims.play("walk_right", true);
            } else if (xDir < 0) {
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

    v.depth = v.y;
  });
}

function update() {
  updateText();
  updatePlayer();
  checkOverlapWithPainting();
  moveVisitors(this);
}

const WALL_TILE = 5;
const PAINTING_TILE = 6;
const paintingTiles = [];

function create() {
  cursors = this.input.keyboard.createCursorKeys();
  map = this.make.tilemap({ key: "museum", tileWidth: 16, tileHeight: 16 });
  map.setCollision([WALL_TILE]);
  const tileset = map.addTilesetImage("walls");
  layer = map.createStaticLayer(0, tileset, 0, 0);
  layer.setScale(SCALE_FACTOR);
  let lastUsedPainting = -1;
  layer.forEachTile(tile => {
    if (tile.index === PAINTING_TILE) {
      const painting = lastUsedPainting + 1;
      tile.properties.visited = false;
      const { x, y } = layer.tileToWorldXY(tile.x, tile.y);
      const img = this.add.image(x + 8, y + 8, paintings[painting]);
      img.setScale(SCALE_FACTOR);
      tile.properties.image = img;
      // TODO need to check proper distribution around 50
      tile.properties.attractiveness = Phaser.Math.Between(0, 100);
      lastUsedPainting = painting;
      paintingTiles.push(tile);
    }
  });
  sortBy(paintingTiles, tile => tile.properties.attractiveness);
  visitors = this.physics.add.group({
    defaultKey: "player",
    defaultFrame: 0,
    frameQuantity: 500
  });
  for (let i = 0; i < 100; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * 1600);
      y = Math.floor(Math.random() * 1600);
    } while (layer.getTileAtWorldXY(x, y).index === WALL_TILE);
    visitors.get(x, y);
  }
  visitors.children.iterate(v => {
    v.setData({
      state: visitorFSM.initialState.value,
      last_state_change: Phaser.Math.Between(Date.now() - 3000, Date.now())
    });
    v.setScale(SCALE_FACTOR);
  });

  this.anims.create({
    key: "walk_right",
    frames: this.anims.generateFrameNumbers("player", {
      start: 1,
      end: 6
    }),
    repeat: -1,
    frameRate: 10
  });
  this.anims.create({
    key: "walk_left",
    frames: this.anims.generateFrameNumbers("player", {
      start: 7,
      end: 12
    }),
    repeat: -1,
    frameRate: 10
  });
  this.anims.create({
    key: "idle",
    frames: this.anims.generateFrameNumbers("player", { start: 0, end: 0 })
  });
  player = this.physics.add.sprite(160, 160, "player", 0);
  player.setScale(SCALE_FACTOR);
  this.physics.add.collider(player, layer);
  // this.physics.add.collider(player, visitors);
  this.physics.add.collider(visitors, layer);
  this.cameras.main.startFollow(player);
  this.cameras.main.zoom = 1;

  const bg = this.add.graphics({ x: 10, y: 15 });
  bg.depth = Number.MAX_SAFE_INTEGER;
  bg.setScrollFactor(0);
  bg.fillStyle(0xaaaaaa, 1);
  bg.fillRect(0, 0, 150, 24);

  text = this.add.text(16, 16, "Score: 0", {
    fontSize: "20px",
    fill: "#ffffff"
  });
  text.depth = Number.MAX_SAFE_INTEGER;
  text.setScrollFactor(0);
}
