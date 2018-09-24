import Phaser from "phaser";
import _sortBy from "lodash-es/sortBy";
import PLAYER from "./assets/img/player.png";
import WALLS from "./assets/img/walls.png";
import MUSEUM from "./assets/map/room.csv";
import paintings from "./paintings";
import Pathfinder from "./pathfinder";
import Visitor from "./visitor";

import { SCALE_FACTOR, TILE_SIZE, PLAYER_VELOCITY, MAP_SIZE } from "./config";

let player;
let visitors = [];
let layer;
let pathfinder;
let text;
let score = 0;
let cursors;
let map;
const WALL_TILE = 5;
const PAINTING_TILE = 6;
let paintingTiles = [];

function preload() {
  this.load.spritesheet("player", PLAYER, {
    frameWidth: TILE_SIZE,
    frameHeight: TILE_SIZE,
    scale: SCALE_FACTOR
  });
  this.load.spritesheet("walls", WALLS, {
    frameWidth: TILE_SIZE,
    frameHeight: TILE_SIZE
  });
  paintings.forEach(painting => this.load.image(painting, painting));
  this.load.tilemapCSV("museum", MUSEUM);
}

function create() {
  cursors = this.input.keyboard.createCursorKeys();
  map = this.make.tilemap({
    key: "museum",
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE
  });
  map.setCollision([WALL_TILE]);
  const tileset = map.addTilesetImage("walls");
  layer = map.createStaticLayer(0, tileset, 0, 0);
  layer.setScale(SCALE_FACTOR);
  pathfinder = new Pathfinder(
    layer.tilemap.layers[0].data.map(row =>
      row.map(col => (col.index === WALL_TILE ? 1 : 0))
    )
  );

  let lastUsedPainting = -1;
  layer.forEachTile(tile => {
    if (tile.index === PAINTING_TILE) {
      const painting = lastUsedPainting + 1;
      tile.properties.visited = false;
      const { x, y } = layer.tileToWorldXY(tile.x, tile.y);
      const img = this.add.image(x, y, paintings[painting]);
      img.setScale(SCALE_FACTOR);
      img.setOrigin(0, 0);
      tile.properties.image = img;
      // TODO need to check proper distribution around 50
      tile.properties.attractiveness = Phaser.Math.Between(0, 100);
      lastUsedPainting = painting;
      paintingTiles.push(tile);
    }
  });
  paintingTiles = _sortBy(
    paintingTiles,
    tile => -tile.properties.attractiveness
  );

  visitors = this.physics.add.group({
    defaultKey: "player",
    classType: Visitor
  });

  const [numTilesW, numTilesH] = MAP_SIZE;
  for (let i = 0; i < 100; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * (numTilesW - 1));
      y = Math.floor(Math.random() * (numTilesH - 1));
    } while (layer.getTileAt(x, y).index === WALL_TILE);
    visitors.get(layer.tileToWorldX(x), layer.tileToWorldY(y), {
      layer,
      pathfinder,
      paintingTiles
    });
  }
  visitors.children.iterate(sprite => {
    sprite.setSize(TILE_SIZE, TILE_SIZE);
    sprite.setScale(SCALE_FACTOR);
    sprite.setOrigin(0, 0);
    sprite.body.updateBounds();
    sprite.body.setOffset(TILE_SIZE, TILE_SIZE);
  });

  this.anims.create({
    key: "walk_x",
    frames: this.anims.generateFrameNumbers("player", {
      start: 0,
      end: 7
    }),
    repeat: -1,
    frameRate: 12
  });
  this.anims.create({
    key: "idle",
    frames: this.anims.generateFrameNumbers("player", { start: 0, end: 0 })
  });
  player = this.physics.add.sprite(160, 160, "player", 0);
  player.setScale(SCALE_FACTOR);
  this.physics.add.collider(player, layer);
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

function updatePlayer() {
  const anyDown =
    cursors.left.isDown ||
    cursors.right.isDown ||
    cursors.up.isDown ||
    cursors.down.isDown;

  if (!anyDown) {
    player.setVelocityX(0);
    player.setVelocityY(0);
    player.anims.play("idle");
    return;
  }

  if (cursors.left.isDown) {
    player.setVelocityX(-PLAYER_VELOCITY);
    player.flipX = true;
    player.anims.play("walk_x", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(PLAYER_VELOCITY);
    player.flipX = false;
    player.anims.play("walk_x", true);
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

function update() {
  updateText();
  updatePlayer();
  checkOverlapWithPainting();
}

new Phaser.Game({
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
});
