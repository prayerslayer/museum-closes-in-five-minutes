import Phaser from "phaser";

// import SPRITES from "./assets/img/exit_game.png";
import PLAYER from "./assets/img/walk_right.png";
import WALLS from "./assets/img/walls.png";
import MUSEUM from "./assets/map/room.csv";
import MONET from "./assets/img/paintings/Monet_Nympheas_1904.png";
import MUNCH from "./assets/img/paintings/Munch_-_The_Scream.png";

const paintings = [MONET, MUNCH];

var config = {
  type: Phaser.AUTO,
  width: 640,
  height: 640,
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
    frameHeight: 16
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
    player.setVelocityX(-80);
    player.anims.play("walk_left", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(80);
    player.anims.play("walk_right", true);
  } else {
    player.setVelocityX(0);
  }

  player.depth = player.y;

  if (cursors.up.isDown) {
    player.setVelocityY(-80);
  } else if (cursors.down.isDown) {
    player.setVelocityY(80);
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
    score += 1;
    tile.properties.image.setTint(0xaaaaaa);
  }
}

function updateText() {
  text.setText("Score: " + score);
}

function moveVisitors() {
  const now = Date.now();
  visitors.children.iterate(v => {
    if (now - v.moved > 3000) {
      const direction = Phaser.Math.RND.weightedPick([0, 1, 2, 3, 4, 5, 6, 7]);
      if (direction >= 4) {
        const xDir = direction == 4 ? -1 : direction === 5 ? 1 : 0;
        const yDir = direction == 6 ? -1 : direction === 7 ? 1 : 0;
        v.setVelocityX(20 * xDir);
        v.setVelocityY(20 * yDir);
        if (xDir > 0) {
          v.anims.play("walk_right", true);
        } else if (xDir < 0) {
          v.anims.play("walk_left", true);
        }
        v.moved = Date.now();
      } else {
        v.setVelocityX(0);
        v.setVelocityY(0);
        v.anims.play("idle", true);
      }
    }
    v.depth = v.y;
  });
}

function update() {
  updateText();
  updatePlayer();
  checkOverlapWithPainting();
  moveVisitors();
}

const WALL_TILE = 5;
const PAINTING_TILE = 6;

function create() {
  cursors = this.input.keyboard.createCursorKeys();
  map = this.make.tilemap({ key: "museum", tileWidth: 16, tileHeight: 16 });
  map.setCollision([WALL_TILE]);
  const tileset = map.addTilesetImage("walls");
  layer = map.createStaticLayer(0, tileset, 0, 0);
  let lastUsedPainting = -1;
  layer.forEachTile(tile => {
    if (tile.index === PAINTING_TILE) {
      const painting = lastUsedPainting + 1;
      tile.properties.visited = false;
      const { x, y } = layer.tileToWorldXY(tile.x, tile.y);
      const img = this.add.image(x + 8, y + 8, paintings[painting]);
      img.setOrigin(1, 1);
      tile.properties.image = img;
      lastUsedPainting = painting;
    }
  });

  visitors = this.physics.add.group({
    defaultKey: "player",
    defaultFrame: 0,
    frameQuantity: 500
  });
  for (let i = 0; i < 100; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * 400);
      y = Math.floor(Math.random() * 400);
    } while (layer.getTileAtWorldXY(x, y).index === WALL_TILE);
    visitors.get(x, y);
  }
  visitors.children.iterate(v => (v.moved = Date.now() - 3000));

  this.anims.create({
    key: "walk_right",
    frames: this.anims.generateFrameNumbers("player", {
      start: 1,
      end: 5
    }),
    repeat: -1,
    frameRate: 10
  });
  this.anims.create({
    key: "walk_left",
    frames: this.anims.generateFrameNumbers("player", {
      start: 6,
      end: 11
    }),
    repeat: -1,
    frameRate: 10
  });
  this.anims.create({
    key: "idle",
    frames: this.anims.generateFrameNumbers("player", { start: 0, end: 0 })
  });
  player = this.physics.add.sprite(40, 40, "player", 0);
  this.physics.add.collider(player, layer);
  // this.physics.add.collider(player, visitors);
  this.physics.add.collider(visitors, layer);
  this.cameras.main.startFollow(player);
  this.cameras.main.zoom = 4;

  text = this.add.text(16, 16, "Score: 0", {
    fontSize: "20px",
    fill: "#ffffff"
  });
  text.setScrollFactor(0);
}
