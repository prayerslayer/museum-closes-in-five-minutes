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
var cursors;

function preload() {
  this.load.setBaseURL("http://localhost:8080");

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

function update() {
  updatePlayer();
}

function create() {
  cursors = this.input.keyboard.createCursorKeys();
  const map = this.add.tilemap("museum", 10, 10, 512, 512);
  map.setCollision([0]);
  const tileset = map.addTilesetImage("tiles");
  const layer = map.createStaticLayer(0, tileset, 0, 0);

  player = this.physics.add.sprite(20, 20, "tiles", 2);
  this.physics.add.collider(player, layer);
  this.cameras.main.startFollow(player);
  this.cameras.main.zoom = 2;
}
