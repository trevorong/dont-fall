import {defs, tiny} from './examples/common.js';
import { FLOOR_HEIGHT, g } from './constants.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

// const g = 0.05; // gravity constant


const body_r = 1;

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
            // console.log("dY: "+this.dY);
            // console.log("dA: "+this.dA);
            // console.log("-----------------------------------------------");
            this.body_loc= this.body_loc.plus(vec3(0, this.dY, 0));
        }
        
        // if (this .freeFall && this.body_loc[1] - body_r > FLOOR_HEIGHT) {
        //     // simulate fall using physics
        //     this.dY -= g;
        //     if (this.body_loc - body_r + this.dY < FLOOR_HEIGHT) {
        //         this.dY = FLOOR_HEIGHT - (this.body_loc - body_r);
        //     } 
        //     this.body_loc= this.body_loc.plus(vec3(0, this.dY, 0));
           
        //     // simulate fall using verlet integration
        //     // const new_loc = this.body_loc.times(2).minus(this.prev_body_loc)
        //     //     .plus(vec3(0, -g * dt * dt, 0));
        //     // this.prev_body_loc = this.body_loc;
        //     // this.body_loc = new_loc[1] - body_r > FLOOR_HEIGHT ?
        //     //     new_loc : vec3(this.body_loc[0], FLOOR_HEIGHT+body_r, this.body_loc[2]);
            
        // }
    }
}
