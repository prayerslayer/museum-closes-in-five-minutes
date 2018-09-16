import Phaser from "phaser";

import SPRITES from "./assets/img/exit_game.png";
import MUSEUM from "./assets/map/room.csv";

var config = {
  type: Phaser.AUTO,
  width: 320,
  height: 320,
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: false,
      debug: true
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
  this.load.spritesheet("tiles", SPRITES, {
    frameWidth: 10,
    frameHeight: 10
  });
  this.load.tilemapCSV("museum", MUSEUM);
}

function updatePlayer() {
  if (cursors.left.isDown) {
    player.setVelocityX(-80);
  } else if (cursors.right.isDown) {
    player.setVelocityX(80);
  } else {
    player.setVelocityX(0);
  }
  if (cursors.up.isDown) {
    player.setVelocityY(-80);
  } else if (cursors.down.isDown) {
    player.setVelocityY(80);
  } else {
    player.setVelocityY(0);
  }
}

function checkOverlapWithPainting() {
  const tile = layer.getTileAtWorldXY(player.x, player.y);
  if (tile.index === DOOR_TILE && !tile.properties.visited) {
    tile.properties.visited = true;
    score += 1;
    map.replaceByIndex(tile.index, GROUND_TILE, tile.x, tile.y, 1, 1);
  }
}

function updateText() {
  text.setText("Score: " + score);
}

function moveVisitors() {
  const now = Date.now();
  visitors.children.iterate(v => {
    if (now - v.moved > 3000) {
      v.setVelocityX(0);
      v.setVelocityY(0);
      const direction = Phaser.Math.RND.weightedPick([0, 1, 2, 3, 4, 5, 6, 7]);
      if (direction !== 0) {
        const xDir = direction == 4 ? -1 : direction === 5 ? 1 : 0;
        const yDir = direction == 6 ? -1 : direction === 7 ? 1 : 0;
        v.setVelocityX(20 * xDir);
        v.setVelocityY(20 * yDir);
        v.moved = Date.now();
      }
    }
  });
}

function update() {
  updateText();
  updatePlayer();
  checkOverlapWithPainting();
  moveVisitors();
}

const DOOR_TILE = 4;
const GROUND_TILE = 1;
const WALL_TILE = 0;

function create() {
  cursors = this.input.keyboard.createCursorKeys();
  map = this.add.tilemap("museum", 10, 10, 512, 512);
  map.setCollision([WALL_TILE]);
  const tileset = map.addTilesetImage("tiles");
  layer = map.createDynamicLayer(0, tileset, 0, 0);
  layer.forEachTile(tile => {
    if (tile.index === DOOR_TILE) {
      tile.properties.visited = false;
    }
  });

  visitors = this.physics.add.group({
    defaultKey: "tiles",
    defaultFrame: 3,
    frameQuantity: 500
  });
  for (let i = 0; i < 100; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * 400);
      y = Math.floor(Math.random() * 400);
    } while (layer.getTileAtWorldXY(x, y).index !== GROUND_TILE);
    visitors.get(x, y);
  }
  visitors.children.iterate(v => (v.moved = Date.now()));
  player = this.physics.add.sprite(20, 20, "tiles", 2);
  this.physics.add.collider(player, layer);
  this.physics.add.collider(visitors, layer);
  this.cameras.main.startFollow(player);
  this.cameras.main.zoom = 1;

  text = this.add.text(16, 16, "Score: 0", {
    fontSize: "20px",
    fill: "#ffffff"
  });
  text.setScrollFactor(0);
}
