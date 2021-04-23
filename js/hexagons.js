const FN = 1 / (2 * Math.tan(Math.PI / 6));

class Hexagon {
  constructor(x, y, scl, mode, control_radius = 0.75) {
    this._x = x;
    this._y = y;
    this._scl = scl;
    this._mode = mode;
    this._state_from = 0;
    this._state_to = 1;
    this._control_radius = control_radius;

    this._w = Math.sqrt(3) * this._scl;
    this._h = this._scl * 2;
    this._dx = [0, this._w / 2];
    //this._center_x = this._w * 0.75 + this._x * this._w + this._dx[this._y % 2];
    //this._center_y = this._h * 1.125 + this._y * this._h * 0.75;

    this._center_x = this._x * this._w + this._dx[this._y % 2];
    this._center_y = this._y * this._h * 0.75;

    this._exchanges = [{
      from: 0,
      to: 2,
    },
    {
      from: 1,
      to: 3,
    }, {
      from: 4,
      to: 5,
    },];

    this._frame_offset = 0;

    this._calculateAngles();
    this._generateVertices(0);
  }

  _wrap(angle) {
    if (angle < 0) angle += Math.PI * 2;
    else if (angle > Math.PI * 2) angle -= Math.PI * 2;

    return angle;
  }

  _calculateAngles() {
    this._angle_from = Math.PI * 2 / 6 * this._state_from;
    this._angle_to = Math.PI * 2 / 6 * this._state_to;

    if (Math.abs(this._angle_from - this._angle_to) > Math.PI * 2) {
      this._angle_from = this._wrap(this._angle_from);
      this._angle_to = this._wrap(this._angle_to);
    }
  }

  _generateVertices(percent) {
    const dPhi = this._angle_from + percent * (this._angle_to - this._angle_from);

    this._control_points = [];
    this._vertices = [];
    for (let s = 0; s < 6; s++) {
      const theta = Math.PI * 2 / 6 * s + Math.PI / 2 + dPhi;

      const cx = this._scl * this._control_radius * Math.cos(theta);
      const cy = this._scl * this._control_radius * Math.sin(theta);
      this._control_points.push({
        theta: theta,
        x: cx,
        y: cy,
      });

      const vx = this._scl * Math.cos(theta);
      const vy = this._scl * Math.sin(theta);
      this._vertices.push({
        theta: theta,
        x: vx,
        y: vy,
      });
    }

    this._middle_points = [];
    for (let s = 0; s < 6; s++) {
      const theta = Math.PI * 2 / 6 * s + dPhi;
      const vx = this._scl * FN * Math.cos(theta);
      const vy = this._scl * FN * Math.sin(theta);
      this._middle_points.push({
        theta: theta,
        x: vx,
        y: vy,
      });
    }
  }

  show(percent, ctx) {
    this._generateVertices(percent);

    ctx.save();
    ctx.translate(this._center_x, this._center_y);

    if (this._mode == 0) {
      this._exchanges.forEach(e => {
        const start = this._middle_points[e.from];
        const end = this._middle_points[e.to];
        const control_1 = this._control_points[e.from];
        const control_2 = this._control_points[e.to];

        ctx.strokeStyle = "rgb(220, 220, 220)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.bezierCurveTo(control_1.x, control_1.y, control_2.x, control_2.y, end.x, end.y);
        ctx.stroke();
      });
    } else if (this._mode == 1) {
      for (let i = 0; i < 6; i++) {
        const hue = i / 6 * 360;
        const start = this._vertices[i];
        const end = this._vertices[(i + 1) % 6];

        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.fill();
      }
    } else if (this._mode == 2) {
      this._exchanges.forEach((e, i) => {
        const hue = i / 6 * 360;
        const start = this._middle_points[e.from];
        const end = this._middle_points[e.to];

        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.fill();
      });
    }

    ctx.restore();
  }

  isClose(coords) {
    const dist = Math.sqrt(Math.pow(coords.x - this._center_x, 2) + Math.pow(coords.y - this._center_y, 2));
    return dist < this._scl;
  }

  get state_from() {
    return this._state_from;
  }

  set state_from(s) {
    this._state_from = s;
    this._calculateAngles();
  }

  get state_to() {
    return this._state_to;
  }

  set state_to(t) {
    this._state_to = t;
    this._calculateAngles();
  }

  get frame_offset() {
    return this._frame_offset;
  }

  set frame_offset(f) {
    this._frame_offset = f;
  }
}