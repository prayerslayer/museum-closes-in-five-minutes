import Pathfinding from "pathfinding";

export default class Pathfinder {
  constructor(grid) {
    this.grid = new Pathfinding.Grid(grid);
    this.finder = new Pathfinding.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });
  }

  getRandomWalkableTile(excludeTiles = []) {
    let x, y;
    do {
      x = Math.floor(Math.random() * this.grid.width);
      y = Math.floor(Math.random() * this.grid.height);
    } while (
      this.grid.nodes[x][y] === 1 ||
      excludeTiles.findIndex(t => t.x === x && t.y === y) !== -1
    );
    return { x, y };
  }

  findPath(from, to) {
    if (!from || !to) {
      return [];
    }
    const { x: x0, y: y0 } = from;
    const { x: x1, y: y1 } = to;
    return this.finder.findPath(x0, y0, x1, y1, this.grid.clone());
  }
}
