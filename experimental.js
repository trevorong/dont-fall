import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

const g = 9.8; // gravity constant
const c = 3; // damping constant
const d = 1; // distance constraint
export class Rope {
    constructor(n = 10) {
        this.points = [];
        this.n = n;
        // create a rope that starts horizontal
        let position = vec3(0, 0, 0);
        for (let i = 0; i < n; i++) {
            this.points.push(new Point(position, i == 0));
            position = position.plus(vec3(c, 0, 0));
        }
    }

    getPoints() {
        return this.points;
    }

    update(dt) {
        // verlet integration
        const n = this.n;
        for (let i = 0; i < n; i++) {
            const p = this.points[i];
            // x_n+1 = 2x_n - x_n-1 + dt^2a
            const newPosition = p.position.times(2)
                .minus(p.prevPosition)
                .plus(p.acceleration().times(dt*dt));
            p.update(newPosition);
        }

        // jakobsen method
        for (let i = 1; i < n; i++) {
            const p1 = this.points[i-1];
            const p2 = this.points[i];
            const diff = p2.position.minus(p1.position);
            const dir = diff.normalized();
            const dist = (diff.norm() - this.d)/2;
            const vec = dir.times(dist);
            p1.position.plus(vec);
            p2.position.minus(vec);
        }
    }
}

export class Point {
    constructor(position, force = true) { //vec3 or vec4?
        this.position = position;
        this.prevPosition = position; 
        this.force = force;
    }

    update(position) {
        this.prevPosition = this.position;
        this.position = position;
    }

    acceleration() {
        if (!this.force) return vec3(0, 0, 0);
        const grav = vec3(0, -g, 0);
        const damp = this.position.minus(this.prevPosition).times(-d);
        return grav.plus(damp);
    }

    transform() {
        return Mat4.translation(this.position[0], this.position[1], this.position[2]);
    }
}