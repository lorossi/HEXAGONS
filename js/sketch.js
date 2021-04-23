class Sketch extends Engine {
  preload() {
    const reset = document.querySelector("#reset");
    reset.addEventListener("click", e => this.setup(e));
  }

  setup() {
    // parameters
    this._rows = 12;
    this._cols = 12;
    this._duration = 900;
    this._phases = 10;
    this._hexagon_mode = this._random_int(1);
    this._back_colors = ["rgb(15, 15, 15)", "rgb(220, 220, 220)"];
    this._recording = false;
    this._show_fps = false;
    this._auto = true;

    // sketch setup
    this._frame_offset = this._frameCount + 1;
    this._scl = this._width / this._cols;
    this._phase_duration = this._duration / this._phases;
    this._noise = new SimplexNoise();
    console.clear();
    // set page style
    document.body.style.backgroundColor = this._back_colors[this._hexagon_mode];
    const links = document.querySelectorAll("a");
    links.forEach(l => l.style.color = this._back_colors[(this._hexagon_mode + 1) % 2]);
    // setup capturer
    if (this._recording) {
      this._capturer = new CCapture({ format: "png" });
      this._capturer_started = false;
      this._random_saves = 5;
    }
    // setup random saves
    this._save_frame = [];
    for (let i = 0; i < this._random_saves; i++) this._save_frame.push(Math.floor(Math.random() * this._duration));

    // set up states
    this._states = new Array(this._phases);
    for (let i = 0; i < this._phases; i++) {
      this._states[i] = new Array(this._cols * this._rows);
      const noise_theta = Math.PI * 2 * i / this._phases;

      for (let j = 0; j < this._cols * this._rows; j++) {
        const rho = 10;
        const n_scl = 2;
        const x = rho * (1 + Math.cos(noise_theta));
        const y = rho * (1 + Math.sin(noise_theta));
        const pos = j * n_scl;

        this._states[i][j] = this._generateState(x, y, pos);
      }
    }
    // create hexagons
    const control_radius = this._random(-1, 1);
    this._hexagons = [];
    for (let y = 0; y < this._rows; y++) {
      for (let x = 0; x < this._cols; x++) {
        const j = this._cols * x + y;
        const new_h = new Hexagon(x, y, this._scl, this._hexagon_mode, control_radius);

        if (!this._auto) {
          new_h.state_from = this._generateState(x, y, 0);
          new_h.state_to = new_h.state_from;
        }

        this._hexagons.push(new_h);
      }
    }
  }

  draw() {
    if (!this._capturer_started && this._recording) {
      this._capturer_started = true;
      this._capturer.start();
      console.log("%c Recording started", "color: green; font-size: 2rem");
    }

    // set hexagon states
    if (((this._frameCount - this._frame_offset) % this._phase_duration == 0 || this._frameCount == 1) && this._auto) {
      const current_phase = parseInt(this._frameCount / this._phase_duration) % this._phases;
      const next_phase = (current_phase + 1) % this._phases;

      this._hexagons.forEach((h, j) => {
        h.state_from = this._states[current_phase][j];
        h.state_to = this._states[next_phase][j];
      });
    }

    // background
    this.background(this._back_colors[this._hexagon_mode]);

    // draw
    if (this._auto) {
      const percent = this._easeInOut(((this._frameCount - this._frame_offset) % this._phase_duration) / this._phase_duration);
      this._hexagons.forEach(h => h.show(percent, this._ctx));
    } else {
      this._hexagons.forEach(h => {
        let percent;
        if (h.state_from != h.state_to) {
          percent = this._easeInOut((this._frameCount - h.frame_offset) / this._phase_duration);
          if (percent >= 1) {
            percent = 0;
            h.state_from = h.state_to;
          }
        } else {
          percent = 0;
        }
        h.show(percent, this._ctx);
      });
    }


    if (this._save_frame.includes(this._frameCount)) this.saveFrame();

    // show FPS
    if (this._show_fps) {
      this._ctx.save();
      this._ctx.fillStyle = "red";
      this._ctx.font = "30px Hack";
      this._ctx.fillText(parseInt(this._frameRate), 40, 40);
      this._ctx.restore();
    }
    // handle recording
    if (this._recording) {
      if (this._frameCount < this._duration) {
        this._capturer.capture(this._canvas);
      } else {
        this._recording = false;
        this._capturer.stop();
        this._capturer.save();
        console.log("%c Recording ended", "color: red; font-size: 2rem");
      }
    }
  }

  _easeInOut(x) {
    // quartic
    return x < 0.5 ? 8 * Math.pow(x, 4) : 1 - Math.pow(-2 * x + 2, 4) / 2;
  }

  _generateState(x, y, i, excursion = 2) {
    const n = this._noise.noise3D(x, y, i);
    return Math.floor(n * excursion);
  }

  _random(a, b) {
    if (a == undefined && b == undefined) return this._random(0, 1);
    else if (b == undefined) return this._random(0, a);
    else if (a != undefined && b != undefined) return Math.random() * (b - a) + a;
  }

  _random_int(a, b) {
    if (a == undefined && b == undefined) return this._random_int(0, 1);
    else if (b == undefined) return this._random_int(0, a);
    else if (a != undefined && b != undefined) return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  click(e) {
    if (this._auto) return;

    const coords = this._calculate_press_coords(e);
    const close = this._hexagons.filter(h => h.isClose(coords));

    if (close.length > 0) {
      close[0].state_from = close[0].state_to;
      close[0].state_to = close[0].state_from + 1;
      close[0].frame_offset = this._frameCount;
    }
  }

  keydown(e) {
    if (e.code === "Enter") {
      this.setup();
    }
  }
}