import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

const g = 10; // gravity constant
const c = 5; // damping constant
// const meters_per_frame = 0.05;
const meters_per_frame = 0.2;
const repetitions = 15;
export class Rope {
    constructor(n = 10, l = 10, anchor = true) {
        this.points = [];
        this.n = n;
        this.d = l/n;
        // create a rope that starts horizontal
        let position = vec3(0, 0, 0);
        for (let i = 0; i < n; i++) {
            this.points.push(new Point(position, i === 0 && anchor));
            position = position.plus(vec3(this.d, 0, 0));
        }
    }

    getPoints() {
        return this.points;
    }

    update(dt, thrust) {
        // control step size in case of weirdness
        dt = Math.min(dt, 0.02);
        
        // verlet integration
        const n = this.n;
        for (let i = 0; i < n; i++) {
            const p = this.points[i];
            if (p.anchor) {
                if (thrust) p.move(thrust);
            }
            else {
                // x_n+1 = 2x_n - x_n-1 + dt^2a
                const newPosition = p.position.times(2)
                    .minus(p.prevPosition)
                    .plus(p.acceleration().times(dt*dt));
                p.update(newPosition);
            }
        }

        // jakobsen method
        for (let iter = 0; iter < repetitions; iter++){
            for (let i = 1; i < n; i++) {
                const p1 = this.points[i-1];
                const p2 = this.points[i];
                const diff = p2.position.minus(p1.position);
                const dir = diff.normalized();
                const dist = (diff.norm() - this.d)/2;
                const vec = dir.times(dist);
                // don't apply jakobsen to anchors
                if (!p1.anchor && !p2.anchor) {
                    p1.position = p1.position.plus(vec);
                    p2.position = p2.position.minus(vec);
                }
                else if (p1.anchor) {
                    p2.position = p2.position.minus(vec.times(2));
                }
                else if (p2.anchor) {
                    p1.position = p1.position.plus(vec.times(2));
                } 
            }
        }
    }
}

export class Point {
    constructor(position, anchor = false) { //vec3 or vec4?
        this.position = position;
        this.prevPosition = position; 
        this.anchor = anchor;
    }

    // for anchor points
    move(thrust) {
        this.position = this.position.plus(thrust.times(meters_per_frame));
        this.prevPosition = this.position;
    }

    update(position) {
        this.prevPosition = this.position;
        this.position = position;
    }

    acceleration() {
        if (this.anchor) return vec3(0, 0, 0);
        const grav = vec3(0, -g, 0);
        const damp = this.position.minus(this.prevPosition).times(-c);
        return grav.plus(damp);
    }

    transform() {
        return Mat4.translation(...this.position)
            .times(Mat4.scale(0.5, 0.5, 0.5));
    }
}