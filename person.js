import {defs, tiny} from './examples/common.js';
import { FLOOR_HEIGHT, g, AMONG_US_WAIST_H, AMONG_US_WIDTH } from './constants.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

// const g = 0.05; // gravity constant


const body_r = 0.5;

export class Person {
    constructor(x, y, z, mass, freeFall = true, pulley, onRight) {
        this.body_loc = vec3(x, y, z);
        // this.prev_body_loc = vec3(x, y, z);
        this.head_vec = vec3(0, body_r *1.5, 0);

        this.mass = mass;
        this.dV = 0;
        this.dA = 0;

        this.freeFall = freeFall;
        this.inPulley = false;
        this.tensionForces = 0;
        this.pulley = pulley;
        this.onRight = onRight;
    }

    setPos(newPos) {
        this.body_loc = newPos;
        // this.prev_body_loc = newPos;
    }

    getBody() {
        return [
            Mat4.translation(...this.body_loc).times(Mat4.scale(body_r, body_r, body_r)),
            Mat4.translation(
                ...(this.body_loc.plus(this.head_vec))
            ).times(Mat4.scale(body_r/2, body_r/2, body_r/2))
        ];
    }

    stopFalling() {
        this.dV = 0;
        this.dA = 0;
        this.inPulley = false;
        this.freeFall = false;
    }

    onFloor() {
        return this.body_loc[1] <= FLOOR_HEIGHT +AMONG_US_WAIST_H;
    }

    update(dt, thrust) {
        // control step size in case of weirdness
        dt = Math.min(dt, 0.02);

    
        // dx = Math.sqrt(this.dV * this.dV - g * g);
        if (this.freeFall) {
            this.dA = -g; 
        } else if (this.inPulley) {
            this.dA = this.tensionForces;
            // const pulley_dir = this.body_loc[0] - this.pulley.position[0];
            // const contact_dir = this.pulley.radius * pulley_dir / Math.abs(pulley_dir);
            // const pulley_contact = this.pulley.position.plus(vec3(contact_dir, 0, 0));
            // dx = (pulley_contact[0] - this.body_loc[0])/(Math.abs(pulley_contact[1] - this.body_loc[1]));
        }

        if (this.dV * (this.dV+this.dA) >= 0) {
            this.dV += this.dA;
            // console.log("dy: "+this.dV);
            const new_loc = this.body_loc.plus(vec3(0, this.dV, 0));
            if (new_loc[1] < FLOOR_HEIGHT +AMONG_US_WAIST_H) {
                new_loc[1] = FLOOR_HEIGHT + AMONG_US_WAIST_H;
                this.stopFalling();
            }
            if (this.body_loc[1] <= this.pulley.position[1] && new_loc[1] > this.pulley.position[1]) {
                this.stopFalling();
                new_loc[1] = this.pulley.position[1];
            }
            this.body_loc = new_loc;
        } else {
            // this.dV = 0;
            // this.dA = 0;
            // this.freeFall = 0;
            this.stopFalling();
        }
        // console.log("in update");
        if (this.body_loc[1] < this.pulley.position[1] && this.body_loc[1] > FLOOR_HEIGHT+AMONG_US_WAIST_H) {
            // console.log("--------------------");
            // console.log("pulley height: "+this.pulley.position[1]);
            // console.log("person height: "+this.body_loc[1] );
            // console.log("floor _ waist height: " + FLOOR_HEIGHT+AMONG_US_WAIST_H);
            // const pulley_dir = this.body_loc[0] - this.pulley.position[0];
            // const contact_dir = this.pulley.radius * pulley_dir / Math.abs(pulley_dir);
            // if (pulley_dir.norm() < this.pulley.radius) {
            //     contact_dir *= -1;
            // }
            const pulley_contact = this.pulley.position.plus(vec3(this.pulley.radius * (this.onRight ? 1:-1), 0, 0));

            const x_dist = pulley_contact[0] - this.body_loc[0];
            const y_dist = Math.abs(pulley_contact[1] - this.body_loc[1]);
            let dx = Math.min(x_dist/y_dist, 3) * Math.max(this.dV, 1);
            if (y_dist < this.pulley.radius) {
                // dx = Math.min(Math.abs(Math.abs(x_dist)-AMONG_US_WIDTH/2) , Math.abs(dx));
                // dx = this.onRight ? -dx : dx;
                // new stuff might cause bugs
                const dist_person_to_pulley = Math.abs(this.pulley.position[0] - this.body_loc[0]) - AMONG_US_WIDTH/2;
                if (dist_person_to_pulley < this.pulley.radius) {
                    const dist_from_center = this.pulley.radius - dist_person_to_pulley;
                    dx = this.onRight ? dist_from_center : -dist_from_center;
                } else if (dist_person_to_pulley == this.pulley.radius) {
                    console.log("touching");
                    dx = 0;
                } else {
                    dx = Math.min(Math.abs(Math.abs(x_dist)-AMONG_US_WIDTH/2) , Math.abs(dx));
                    dx = this.onRight ? -dx : dx;
                }
            }

            const new_loc = this.body_loc.plus(vec3(dx,0, 0));
            this.body_loc = new_loc;
            // console.log("dx: "+dx);
        }


        // let new_loc;
        // if (this.freeFall) {
        //     this.dA = -g;
        //     new_loc = this.body_loc.plus(vec3(0, this.dV, 0)); 
        // } else if (this.inPulley) {
        //     this.dA = this.tensionForces;
        //     const pulley_dir = this.body_loc[0] - this.pulley.position[0];
        //     const contact_dir = this.pulley.radius * pulley_dir / Math.abs(pulley_dir);
        //     const pulley_contact = this.pulley.position.plus(vec3(contact_dir, 0, 0));
        //     console.log("pulley contact: "+pulley_contact);
        //     const dir_v = pulley_contact.minus(this.body_loc).normalized();
        //     console.log("dir_v: "+dir_v);
        //     dir_v.scale_by(this.dV);
        //     new_loc = this.body_loc.plus(dir_v); 
        // } else {
        //     new_loc = this.body_loc;
        // }

        // if (this.dV * (this.dV+this.dA) >= 0) {
        //     this.dV += this.dA;
        //     // new_loc = this.body_loc.plus(
        //     //     this.pulley.position.plus(vec3(contact_dir, 0, 0)).minus(this.body_loc).normalize() * this.dV
        //     // ); 
        //     if (new_loc[1] < FLOOR_HEIGHT +AMONG_US_WAIST_H) {
        //         new_loc[1] = FLOOR_HEIGHT + AMONG_US_WAIST_H;
        //     }
        //     this.body_loc = new_loc;
        // }
    }
}
