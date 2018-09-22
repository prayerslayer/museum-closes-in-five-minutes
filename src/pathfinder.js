import Pathfinding from "pathfinding";

export default class Pathfinder {
  constructor(grid) {
    this.grid = new Pathfinding.Grid(grid);
    this.finder = new Pathfinding.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });
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
