function mapN(func, ...arrays) {
  const result = [];
  const minlen = Math.min.apply(
    null,
    arrays.map((a) => a.length)
  );
  for (let i = 0; i < minlen; ++i) {
    result.push(
      func.apply(
        null,
        arrays.map((a) => a[i])
      )
    );
  }
  return result;
}
function vecInnerProduct(va, vb) {
  return mapN((a, b) => a * b, va, vb).reduce((a, b) => a + b, 0);
}

class Matrix3f {
  constructor(...args) {
    if (args.length === 9) {
      this._fromComponents.apply(this, args);
    } else if (args.length === 3) {
      this._fromRows(...args);
    } else if (args.length === 4) {
      const columns = args[3];
      if (columns) {
        this._fromColumns(...args);
      } else {
        this._fromRows(...args);
      }
    } else if (args.length === 1) {
      this._fromMatrix(args[0]);
    } else {
      this._fromComponents(0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
  }
  static fromMatrix(matrix) {
    return new Matrix3f(matrix);
  }
  _fromMatrix(matrix) {
    this.array = [...matrix.array];
  }
  static fromComponents(...args) {
    return new Matrix3f(...args);
  }
  _fromComponents(x1, x2, x3, y1, y2, y3, z1, z2, z3) {
    this.array = [x1, x2, x3, y1, y2, y3, z1, z2, z3];
  }
  static fromRows(...args) {
    return new Matrix3f(...args);
  }
  _fromRows(v1, v2, v3) {
    this.array = [...v1, ...v2, ...v3];
  }
  static fromColumns(...args) {
    return new Matrix3f(...args, true);
  }
  _fromColumns(v1, v2, v3) {
    this.array = [v1[0], v2[0], v3[0], v1[1], v2[1], v3[1], v1[2], v2[2], v3[2]];
  }
  static identity() {
    return new Matrix3f(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }
  static translation(...args) {
    if (args.length === 2) {
      const [x, y] = args;
      return new Matrix3f(1, 0, x, 0, 1, y, 0, 0, 1);
    }
    if (args.length === 3) {
      const [x, y, z] = args;
      return new Matrix3f(1, 0, x, 0, 1, y, 0, 0, z);
    }
    if (args.length === 1) {
      return Matrix3f.translation(...args[0]);
    }
    return Matrix3f.identity();
  }
  static scaling(x, y, z = 1) {
    return new Matrix3f(x, 0, 0, 0, y, 0, 0, 0, z);
  }
  static rotation(angle) {
    const cosine = Math.cos(-angle);
    const sine = Math.sin(-angle);
    return new Matrix3f(cosine, -sine, 0, sine, cosine, 0, 0, 0, 1);
  }
  translationComponent() {
    return Matrix3f.translation(this.getColumn(2).slice(0, 2));
  }
  rotationComponent() {
    const a = this.array;
    return new Matrix3f(a[0], a[1], 0, a[3], a[4], 0, 0, 0, 1);
  }
  getRow(i) {
    return this.array.slice(i * 3, i * 3 + 3);
  }
  getRows() {
    return [this.getRow(0), this.getRow(1), this.getRow(2)];
  }

  getColumn(i) {
    return [this.array[i], this.array[i + 3], this.array[i + 6]];
  }
  getColumns() {
    return [this.getColumn(0), this.getColumn(1), this.getColumn(2)];
  }

  getCanvasTransform() {
    return this.getColumns().flatMap((col) => col.slice(0, 2));
  }
  translate(x, y) {
    this.array[2] += x;
    this.array[5] += y;
    return this;
  }
  setTranslateY(y) {
    this.array[5] = y;
    return this;
  }
  rotateInPlace(angle) {
    const rot = Matrix3f.rotation(angle);

    const comps = [
      vecInnerProduct(this.getRow(0).slice(0, 2), rot.getColumn(0).slice(0, 2)),
      vecInnerProduct(this.getRow(0).slice(0, 2), rot.getColumn(1).slice(0, 2)),
      vecInnerProduct(this.getRow(1).slice(0, 2), rot.getColumn(0).slice(0, 2)),
      vecInnerProduct(this.getRow(1).slice(0, 2), rot.getColumn(1).slice(0, 2)),
    ];

    this.array[0] = comps[0];
    this.array[1] = comps[2];
    this.array[3] = comps[1];
    this.array[4] = comps[3];
    return this;
  }

  compose(mat3f) {
    const components = [];
    const aRows = this.getRows();
    const bCols = mat3f.getColumns();
    for (let i = 0; i < 3; ++i) {
      for (let j = 0; j < 3; ++j) {
        components.push(vecInnerProduct(aRows[i], bCols[j]));
      }
    }
    return Matrix3f.fromComponents.apply(null, components);
  }

  applyToPoint(point) {
    const aRows = this.getRows();
    return [
      vecInnerProduct(aRows[0], point),
      vecInnerProduct(aRows[1], point),
      vecInnerProduct(aRows[2], point),
    ];
  }
}

class MatrixStack {
  constructor() {
    this.stack = [Matrix3f.identity()];
  }
  push(matrix) {
    this.stack.push(this.top().compose(matrix));
  }
  top() {
    return this.stack[this.stack.length - 1];
  }
  pop() {
    this.stack.pop();
  }
  applyTop(ctx) {
    ctx.setTransform.apply(ctx, this.top().getCanvasTransform());
  }
}

const gMatrixStack = new MatrixStack();

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function MinkowskiDiffOpposites(hullA, hullB, direction) {
  const farthestA = hullA.farthestPointToDirection(direction);
  const farthestB_oppositeA = hullB.farthestPointToDirection(direction.map((k) => -k));
  const minkowskiDifference = mapN((a, b) => a - b, farthestA, farthestB_oppositeA);
  return minkowskiDifference;
}

function tripleProduct(a, b, c) {
  const ac = vecInnerProduct(a, c);
  const bc = vecInnerProduct(b, c);

  return mapN(
    (b, a) => b - a,
    b.map((k) => k * ac),
    a.map((k) => k * bc)
  );
}

function GJKcollisionForSingleHulls(hullA, hullB) {
  let direction = [1.0, 1.0, 0];
  let minkowskiDiff1 = MinkowskiDiffOpposites(hullA, hullB, direction);

  direction = minkowskiDiff1.map((k) => -k); // look towards 0,0
  let minkowskiDiff2 = MinkowskiDiffOpposites(hullA, hullB, direction);
  if (vecInnerProduct(minkowskiDiff2, direction) <= 0) {
    return false; // no collision
  }

  direction = minkowskiDiff2.map((k) => -k); // look towards 0,0

  let ab = mapN((a, b) => a - b, minkowskiDiff1, minkowskiDiff2);
  direction = tripleProduct(ab, direction, ab); // normal towards origin
  if (vecInnerProduct(direction, direction) <= 0) {
    direction = [ab[1], -ab[0], 0.0]; //perpendicular to ab
  }

  while (true) {
    let minkowskiDiff3 = MinkowskiDiffOpposites(hullA, hullB, direction);
    if (vecInnerProduct(minkowskiDiff3, direction) <= 0) {
      return false;
    }
    const d3origin = minkowskiDiff3.map((k) => -k); // look towards 0,0
    const d3d2 = mapN((a, b) => a - b, minkowskiDiff2, minkowskiDiff3);
    const d3d1 = mapN((a, b) => a - b, minkowskiDiff1, minkowskiDiff3);

    const d3d2Normal = tripleProduct(d3d1, d3d2, d3d2);
    const d3d1Normal = tripleProduct(d3d2, d3d1, d3d1);
    if (vecInnerProduct(d3d1Normal, d3origin) > 0) {
      minkowskiDiff2 = minkowskiDiff3;
      direction = d3d1Normal;
    } else if (vecInnerProduct(d3d2Normal, d3origin) > 0) {
      minkowskiDiff1 = minkowskiDiff3;
      direction = d3d2Normal;
    } else {
      return [minkowskiDiff1, minkowskiDiff2, minkowskiDiff3];
    }
  }
}

function GJKcollision(objA, objB) {
  const hullsA = objA.getConvexHulls();
  const hullsB = objB.getConvexHulls();

  for (const hullA of hullsA) {
    for (const hullB of hullsB) {
      const collides = GJKcollisionForSingleHulls(hullA, hullB);
      if (collides) {
        return collides;
      }
    }
  }
  return false;
}

class Eye {
  constructor(x, y, scale = 0.125, lookAngle = 0.0) {
    this.transform = Matrix3f.identity()
      .compose(Matrix3f.translation(x, y))
      .compose(Matrix3f.scaling(scale, scale))
      .compose(Matrix3f.translation(-0.5, -0.5));
    this.setLookangle(lookAngle);
  }
  setLookangle(lookAngle) {
    this.pose = Matrix3f.translation(
      Matrix3f.rotation(lookAngle).applyToPoint([0.5, 0.0, 1.0])
    ).compose(Matrix3f.translation(0.0, 0.5));
    return this;
  }
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "white";
    gMatrixStack.push(this.transform.compose(this.pose));
    gMatrixStack.applyTop(ctx);

    ctx.fillRect(0, 0, 1, 1);

    gMatrixStack.pop();
    ctx.restore();
  }
}

class Beak {
  constructor(x, y, size = 0.125) {
    this.transform = Matrix3f.identity()
      .compose(Matrix3f.translation(x, y))
      .compose(Matrix3f.scaling(size, size * 2))
      .compose(Matrix3f.translation(0.0, -0.5));
  }
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "yellow";
    gMatrixStack.push(this.transform);
    gMatrixStack.applyTop(ctx);

    ctx.fillRect(0, 0, 1, 1);

    gMatrixStack.pop();
    ctx.restore();
  }
}

function vecNormalize(vec) {
  const len = Math.sqrt(vecInnerProduct(vec, vec));
  return vec.map((k) => k / len);
}

class CollisionRectangle {
  constructor(
    transform,
    points = [
      [0, 0, 1],
      [0, 1, 1],
      [1, 1, 1],
      [1, 0, 1],
    ]
  ) {
    this.points = points.map((p) => transform.applyToPoint(p));
    // remove 1.5px from each edge to avoid miscalculating collisions
    const x = vecNormalize(mapN((a, b) => a - b, this.points[1], this.points[0])).map(
      (k) => k * 1.5
    );
    const y = vecNormalize(mapN((a, b) => a - b, this.points[2], this.points[1])).map(
      (k) => k * 1.5
    );
    this.points[0] = mapN((a, b, c) => a + b + c, this.points[0], x, y);
    this.points[1] = mapN((a, b, c) => a - b + c, this.points[1], x, y);
    this.points[2] = mapN((a, b, c) => a - b - c, this.points[2], x, y);
    this.points[3] = mapN((a, b, c) => a + b - c, this.points[3], x, y);
  }
  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = "red";
    ctx.fillStyle = "blue";
    ctx.setTransform(...Matrix3f.identity().getCanvasTransform());
    ctx.beginPath();
    ctx.moveTo(this.points[0][0], this.points[0][1]);
    for (const point of this.points) {
      ctx.lineTo(point[0], point[1]);
      ctx.fillRect(point[0] - 5, point[1] - 5, 10, 10);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  getConvexHulls() {
    return [this];
  }
  farthestPointToDirection(directionVector) {
    const rect = this.points;
    let maxPoint = rect[0];
    let max = Number.NEGATIVE_INFINITY;
    for (const realPoint of rect) {
      const projection = vecInnerProduct(realPoint, directionVector);
      if (max < projection) {
        max = projection;
        maxPoint = realPoint;
      }
    }
    return maxPoint;
  }
}

class Bird2 {
  constructor(x, y, scale = 40) {
    this.transform = Matrix3f.identity()
      .compose(Matrix3f.translation(x, y))
      .compose(Matrix3f.scaling(scale, scale))
      .compose(Matrix3f.translation(-0.5, -0.5));
    this.velocity = [0, 0, 0.025]; // [x, y, angle] per second
    this.components = [new Eye(0.25, 0.25), new Eye(0.75, 0.25), new Beak(0.5, 0.5)];
    this.size = scale;
  }
  draw(ctx) {
    ctx.save();
    ctx.fillStyle =
      "rgb(" +
      Math.min(255, Math.max(0.0, Math.floor(150 * Math.abs(this.velocity[2] / 0.3) - 50))) +
      ", 0,0)";
    gMatrixStack.push(this.transform);
    gMatrixStack.applyTop(ctx);
    ctx.fillRect(0, 0, 1, 1);

    for (const component of this.components) {
      component.draw(ctx);
    }

    gMatrixStack.pop();
    ctx.restore();
  }
  physics(dt, gravity) {
    this.velocity[1] += gravity * dt;
    this.velocity[2] *= 0.2 ** dt;
    this.transform = Matrix3f.identity()
      .compose(Matrix3f.translation(this.velocity[0], this.velocity[1]))
      .compose(this.transform)
      .compose(Matrix3f.translation(0.5, 0.5))
      .compose(Matrix3f.rotation(this.velocity[2]))
      .compose(Matrix3f.translation(-0.5, -0.5));
  }
  jump(gravity) {
    this.velocity[1] *= 0.75;
    this.velocity[1] -= 0.5 * gravity;
    this.velocity[2] += 0.11;
    if (this.velocity[1] < -0.7 * gravity) {
      this.velocity[1] = -0.7 * gravity;
    }
  }
  getConvexHulls() {
    return [
      new CollisionRectangle(this.transform, [
        [0, 0, 1],
        [0, 1, 1],
        [1, 1, 1],
        [1, 0, 1],
      ]),
    ];
  }
}

class ObstacleRectangle {
  constructor(x, y, width, height, angle = 0.0) {
    this.transform = Matrix3f.identity()
      .compose(Matrix3f.rotation(angle))
      .compose(Matrix3f.translation(x, y))
      .compose(Matrix3f.scaling(width, height))
      .compose(Matrix3f.translation(-0.5, 0.0));
  }
  draw(ctx) {
    ctx.save();
    gMatrixStack.push(this.transform);
    gMatrixStack.applyTop(ctx);

    ctx.fillRect(0, 0, 1, 1);

    gMatrixStack.pop();
    ctx.restore();
  }
}

class Obstacle2 {
  constructor(x, y, width, height, gap = 240) {
    this.transform = Matrix3f.identity().compose(Matrix3f.translation(x, y));
    this.components = [
      new ObstacleRectangle(0.0, gap / 2, width, height, degreesToRadians(180)),
      new ObstacleRectangle(0.0, gap / 2, width, height, 0),
    ];
    this.passed = false;
  }
  draw(ctx) {
    ctx.save();
    gMatrixStack.push(this.transform);
    gMatrixStack.applyTop(ctx);
    ctx.fillStyle = "green";

    for (const component of this.components) {
      component.draw(ctx);
    }

    gMatrixStack.pop();
    ctx.restore();
  }
  move(x, y) {
    this.transform = this.transform.compose(Matrix3f.translation(x, y));
  }
  getConvexHulls() {
    return this.components.map((c) => new CollisionRectangle(this.transform.compose(c.transform)));
  }
}

class FlippyBird {
  constructor(canvasId = "flippy-bird-canvas") {
    this.canvas = document.getElementById(canvasId);
    this.canvas.height = this.canvas.clientHeight;
    this.canvas.width = this.canvas.clientWidth;
    this.ctx = this.canvas.getContext("2d");
    this.lastUpdate = performance.now();
    this.lastTick = this.lastUpdate;
    this.now = this.lastUpdate;
    this.timePerTick = 1000 / 120;
    this.obstacles = [];
    this.passedObstacles = 0;
    this.ended = true;
    this.gravity = 20;
    this.player = new Bird2(this.canvas.width / 3.0, this.canvas.height / 2.0, 40);
    this.bottom = new CollisionRectangle(Matrix3f.identity(), [
      [-100, this.canvas.height, 1],
      [-100, this.canvas.height + 2000, 1],
      [this.canvas.width + 100, this.canvas.height + 2000, 1],
      [this.canvas.width + 100, this.canvas.height, 1],
    ]);
    this.top = new CollisionRectangle(Matrix3f.identity(), [
      [-100, -2000, 1],
      [-100, 0, 1],
      [this.canvas.width + 100, 0, 1],
      [this.canvas.width + 100, -2000, 1],
    ]);
    this.currentClickCb = [
      () => {
        this.begin();
      },
    ];
  }
  get speed() {
    return -200 - 5 * this.passedObstacles;
  }
  init() {
    this.canvas.addEventListener("mousedown", () =>
      this.currentClickCb[this.currentClickCb.length - 1]()
    );
    return this;
  }
  begin() {
    console.log("Begin game");
    this.currentClickCb.push(() => this.player.jump(this.gravity));
    this.player = new Bird2(this.canvas.width / 3.0, this.canvas.height / 2.0, 40);
    this.lastUpdate = performance.now();
    this.lastTick = this.lastUpdate;
    this.now = this.lastUpdate;
    this.obstacles = [];
    this.ended = false;
    this.passedObstacles = 0;
    this.startLoop();
  }
  startLoop() {
    console.log("Starting main loop");
    const mainLoop = (timestamp) => {
      this.runLogic(timestamp);
      this.drawScene();
      if (!this.ended) {
        requestAnimationFrame(mainLoop);
      }
    };
    requestAnimationFrame(mainLoop);
  }
  end() {
    console.log("Ending game");
    this.ended = true;
    this.currentClickCb.pop();
  }
  runLogic(timestamp) {
    const ticks = Math.floor((timestamp - this.lastTick) / this.timePerTick);
    for (let i = 0; i < ticks; i += 1) {
      const dt = this.timePerTick / 1000;
      const speed = this.speed;
      const obstacleMoveX = speed * dt;
      this.obstacles.forEach((o) => o.move(obstacleMoveX, 0.0));
      this.player.physics(dt, this.gravity);

      if (this.obstacles.length === 0) {
        this.obstacles.push(
          new Obstacle2(this.canvas.width + 100, Math.random() * this.canvas.height, 200, 30000)
        );
      } else if (
        this.obstacles[this.obstacles.length - 1]
          .getConvexHulls()[0]
          .farthestPointToDirection([-1, 0, 0])[0] < this.canvas.width
      ) {
        const farthestToRight =
          this.obstacles.length === 0
            ? this.canvas.width + 100
            : this.obstacles[this.obstacles.length - 1]
                .getConvexHulls()[0]
                .farthestPointToDirection([1, 0, 0])[0];
        this.obstacles.push(
          new Obstacle2(
            Math.min(
              farthestToRight + (this.canvas.width / 4) * 3,
              farthestToRight + 200 - 1.5 * speed
            ),
            Math.random() * this.canvas.height,
            200,
            30000
          )
        );
      }

      if (GJKcollision(this.player, this.bottom)) {
        let point = this.player.getConvexHulls()[0].farthestPointToDirection([0, 1, 0]);
        this.player.velocity[1] *= -0.2;
        this.player.velocity[2] = ((speed * dt) / (2 * Math.PI)) * 0.2;

        this.player.transform = Matrix3f.translation(
          0.0,
          Math.min(0.0, this.canvas.height - point[1])
        ).compose(this.player.transform);
      }

      if (GJKcollision(this.player, this.top)) {
        let point = this.player.getConvexHulls()[0].farthestPointToDirection([0, -1, 0]);
        this.player.velocity[1] *= -0.2;

        this.player.transform = Matrix3f.translation(0.0, Math.max(0.0, 0.0 - point[1])).compose(
          this.player.transform
        );
      }

      for (const obstacle of this.obstacles.filter((o) => !o.passed)) {
        const playerLeft = this.player.getConvexHulls()[0].farthestPointToDirection([-1, 0, 0]);
        const obsRight = obstacle.getConvexHulls()[0].farthestPointToDirection([1, 0, 0]);
        const direction = vecInnerProduct(
          mapN((a, b) => a - b, obsRight, playerLeft),
          [1, 0, 0]
        );
        if (direction < 0) {
          obstacle.passed = true;
          this.passedObstacles += 1;
        }
      }

      // for (const obstacle of this.obstacles) {
      //   if (GJKcollision(this.player, obstacle)) {
      //     this.end();
      //     return;
      //   }
      // }

      this.obstacles = this.obstacles.filter((obstacle) => {
        const screenLeft = [0, 0, 0];
        const obsRight = obstacle.getConvexHulls()[0].farthestPointToDirection([1, 0, 0]);
        const direction = vecInnerProduct(
          mapN((a, b) => a - b, obsRight, screenLeft),
          [1, 0, 0]
        );
        // keep obstacles that are still on screen
        return direction >= 0;
      });
    }
    this.lastTick += this.timePerTick * ticks;
  }
  drawScene() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.obstacles.forEach((o) => o.draw(this.ctx));
    this.player.draw(this.ctx);

    this.top.draw(this.ctx);
    this.bottom.draw(this.ctx);
    this.ctx.font = "30px Arial";
    this.ctx.fillStyle = "black";
    this.ctx.fillText("Flippy Bird: " + this.passedObstacles, 10, 50);
    if (this.ended) {
      this.ctx.fillStyle = "black";
      this.ctx.fillText("Game Over", this.canvas.width / 2 - 20, this.canvas.height / 2);
    }
  }
}

new FlippyBird("flippy-bird-canvas").init().begin();
