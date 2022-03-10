import {defs, tiny} from './examples/common.js';
import { FLOOR_HEIGHT, g, AMONG_US_WAIST_H } from './constants.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

// const g = 0.05; // gravity constant


const body_r = 0.5;

export class Person {
    constructor(x, y, z, mass, freeFall = true) {
        this.body_loc = vec3(x, y, z);
        this.prev_body_loc = vec3(x, y, z);
        this.head_vec = vec3(0, body_r *1.5, 0);

        this.mass = mass;
        this.dY = 0;
        this.dA = 0;

        this.freeFall = freeFall;
        this.inPulley = false;
        this.tensionForces = 0;
    }

    setPos(newPos) {
        this.body_loc = newPos;
        this.prev_body_loc = newPos;
    }

    getBody() {
        return [
            Mat4.translation(...this.body_loc).times(Mat4.scale(body_r, body_r, body_r)),
            Mat4.translation(
                ...(this.body_loc.plus(this.head_vec))
            ).times(Mat4.scale(body_r/2, body_r/2, body_r/2))
        ];
    }

    stopMoving() {
        this.dY = 0;
        this.dA = 0;
        this.inPulley = false;
        this.freeFall = false;
    }

    update(dt, thrust) {
        // control step size in case of weirdness
        dt = Math.min(dt, 0.02);

        if (this.freeFall) {
            this.dA = -g;
        } else if (this.inPulley) {
            this.dA = this.tensionForces;
        }

        if (this.dY * (this.dY+this.dA) >= 0) {
            this.dY += this.dA;
            const new_loc = this.body_loc.plus(vec3(0, this.dY, 0)); 
            if (new_loc[1] < FLOOR_HEIGHT +AMONG_US_WAIST_H) {
                new_loc[1] = FLOOR_HEIGHT + AMONG_US_WAIST_H;
            }
            this.body_loc = new_loc;
        }
    }
}
