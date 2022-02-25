import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

// Rope simulation code based off this article
// https://www.owlree.blog/posts/simulating-a-rope.html

const g = 20; // gravity constant
const c = 250; // damping constant
// const meters_per_frame = 0.05;
const meters_per_frame = 0.2;
const jakobsen_iters = 15;
const HUMAN = 150;
export class Rope {
    constructor(n = 10, l = 10, start, anchor = true, radius = 0.5) {
        this.points = [];
        this.n = n;
        this.d = l/n;
        // create a rope that starts horizontal
        let position = start || vec3(0, 0, 0);
        for (let i = 0; i < n; i++) {
            const anchorPoint = (i === 0 || i == n-1);
            const mass = i === 0 ? HUMAN : i === n - 1 ? HUMAN : 1
            this.points.push(new Point(position, anchorPoint && anchor, radius, mass));
            position = position.plus(vec3(this.d, 0, 0));
        }
    }

    getPoints() {
        return this.points;
    }

    toggleAnchor(i = this.n - 1) {
        this.points[i].toggleAnchor();
    }

    update(dt, thrust, pulleys) {
        // control step size in case of weirdness
        dt = Math.min(dt, 0.02);
        
        // verlet integration
        const n = this.n;
        let ti = 0;
        for (let i = 0; i < n; i++) {
            const p = this.points[i];
            if (p.anchor) {
                if (thrust && thrust.length && thrust.length > ti) {
                    p.move(thrust[ti++]);
                }
            }
            else {
                // x_n+1 = 2x_n - x_n-1 + dt^2a
                const newPosition = p.position.times(2)
                    .minus(p.prevPosition)
                    .plus(p.acceleration().times(dt*dt));
                // potentially compute friction?
                p.update(newPosition);
            }
        }

        // jakobsen method
        for (let iter = 0; iter < jakobsen_iters; iter++){
            for (let i = 1; i < n; i++) {
                const p1 = this.points[i-1];
                const p2 = this.points[i];
                const diff = p2.position.minus(p1.position);
                const dir = diff.normalized();
                const dist = diff.norm() - this.d;
                const vec = dir.times(dist);
                // don't apply jakobsen to anchors
                if (!p1.anchor && !p2.anchor) {
                    const r1 = p2.mass / (p1.mass + p2.mass);
                    const r2 = 1 - r1;
                    p1.position = p1.position.plus(vec.times(r1));
                    p2.position = p2.position.minus(vec.times(r2));
                }
                else if (p1.anchor) {
                    p2.position = p2.position.minus(vec);
                }
                else if (p2.anchor) {
                    p1.position = p1.position.plus(vec);
                } 
            }
            
            // detect pulley collision
            if (pulleys && pulleys.length) {
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < pulleys.length; j++) {
                        const pulley = pulleys[j];
                        const p = this.points[i];
                        const diff = p.position.minus(pulley.position);
                        const dist = (diff.norm() - (p.radius + pulley.radius));
                        if (dist < 0) {
                            const dir = diff.normalized();
                            const vec = dir.times(dist);
                            p.position = p.position.minus(vec);
                        }
                    }
                }
            }   
        }
    }
}

export class Point {
    constructor(position, anchor = false, radius = 0.5, mass = 1) { //vec3 or vec4?
        this.position = position;
        this.prevPosition = position; 
        this.anchor = anchor;
        this.radius = radius;
        this.mass = mass;
    }

    // for anchor points
    move(thrust) {
        this.position = this.position.plus(thrust.times(meters_per_frame));
        this.prevPosition = this.position;
    }

    toggleAnchor() {
        this.anchor = !this.anchor;
    }

    update(position) {
        this.prevPosition = this.position;
        this.position = position;
    }

    dP() {
        return this.position.minus(this.prevPosition);
    }

    acceleration() {
        if (this.anchor) return vec3(0, 0, 0);
        const grav = vec3(0, -g, 0);
        const damp = this.dP().times(-c/this.mass);
        return grav.plus(damp);
    }

    transform() {
        return Mat4.translation(...this.position)
            .times(Mat4.scale(this.radius, this.radius, this.radius));
    }
}

export class Pulley {
    constructor(position, radius = 1) { 
        this.position = position;
        this.radius = radius;
    }

    transform() {
        return Mat4.translation(...this.position)
            .times(Mat4.scale(this.radius, this.radius, this.radius));
    }
}