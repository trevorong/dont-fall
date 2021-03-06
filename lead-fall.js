import { defs, tiny } from './examples/common.js';
import { Shape_From_File, AmongUs } from './examples/obj-file-demo.js';
import { Person } from './person.js';
import { FLOOR_HEIGHT, climberHeight, pulleyHeight, belayerHeight, cX, bX, slack, cM, bM, friction, g, belayerJ } from './constants.js';
import { Rope, Pulley, Point } from './rope.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

export class DontFall extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        const startLoc = vec3(cX, climberHeight, 0);
        const belayerLoc = vec3(bX, belayerHeight, 0);
        const pulleyLoc = vec3(0, pulleyHeight, 0);
        this.ropeLength = slack + startLoc.minus(pulleyLoc).norm() + pulleyLoc.minus(belayerLoc).norm();

        this.rope = new Rope(90, this.ropeLength, startLoc, belayerLoc, false, 0.2);
        this.thrust = [vec3(0, 0, 0), vec3(0, 0, 0)];
        this.pulley = new Pulley(pulleyLoc, 1);

        this.climber = new Person(...startLoc, cM, false, this.pulley, true);
        this.belayer = new Person(...belayerLoc, bM, false, this.pulley, false);

        this.sunX = 10;

        // sliders
        let cWSlider = document.getElementById("climberWeight");
        let climber_label = document.getElementById("climber-label");
        cWSlider.oninput = (e) => {
            const w = e.target.value;
            climber_label.innerHTML = "Climber Weight: " + w + " lbs";
            this.climber.mass = w*10;
        }

        let bWSlider = document.getElementById("belayerWeight");
        let belayer_label = document.getElementById("belayer-label");
        bWSlider.oninput = (e) => {
            const w = e.target.value;
            belayer_label.innerHTML = "Belayer Weight: " + w + " lbs";
            this.belayer.mass = w*10;
        }

        let cHSlider = document.getElementById("climberHeight");
        let climber_height_label = document.getElementById("climber-height-label");
        cHSlider.oninput = (e) => {
            const h = e.target.value;
            climber_height_label.innerHTML = "Climber Height: " + h + " meters";
            // console.log(val);
            // console.log(b);
            this.climber.setPos(vec3(cX, h - 10, 0));
            this.belayer.setPos(vec3(bX, belayerHeight, 0));
        }

        let pHSlider = document.getElementById("pulleyHeight");
        let pulley_label = document.getElementById("pulley-height-label");
        pHSlider.oninput = (e) => {
            const h = e.target.value;
            pulley_label.innerHTML = "Pulley/Quickdraw Height: " + h + " meters";
            this.pulley.position = vec3(0, h - 10, 0);
        }


        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(5, 50),
            torus2: new defs.Torus(3, 15),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            box: new defs.Cube(),
            floor: new defs.Cube(),
            rockwall: new defs.Cube(),
            planet1: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            planet2: new defs.Subdivision_Sphere(3),
            planet3: new defs.Subdivision_Sphere(4),
            planet4: new defs.Subdivision_Sphere(4),
            moon: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(1),
            teapot: new Shape_From_File("assets/teapot.obj"),
            among: new AmongUs("assets/amongus2.obj"),
        };

        this.shapes.floor.arrays.texture_coord.forEach(v => v.scale_by(10));

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                { ambient: .4, diffusivity: .6, color: hex_color("#ffffff") }),
            test2: new Material(new Gouraud_Shader(),
                { ambient: .4, diffusivity: .1, color: hex_color("#992828") }),
            ring: new Material(new Ring_Shader(),
                { ambient: 1, color: hex_color("#B08040") }),
            sun: new Material(new defs.Phong_Shader(),
                { ambient: 1, color: hex_color("#ffffff") }),
            planet1: new Material(new defs.Phong_Shader(),
                { ambient: 0, diffusivity: 1, color: hex_color("#808080") }),
            planet2gouraud: new Material(new Gouraud_Shader(),
                { diffusivity: 0.3, specularity: 1, color: hex_color("#80FFFF") }),
            planet2phong: new Material(new defs.Phong_Shader(),
                { diffusivity: 0.3, specularity: 1, color: hex_color("#80FFFF") }),
            planet3: new Material(new defs.Phong_Shader(),
                { diffusivity: 1, specularity: 1, color: hex_color("#B08040") }),
            planet4: new Material(new defs.Phong_Shader(),
                { specularity: 1, color: hex_color("#ADD8E6") }),
            moon: new Material(new defs.Phong_Shader(),
                { diffusivity: 1, color: hex_color("#00ff00") }),
            texture: new Material(new defs.Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/bg.png", "NEAREST")
            }),
            texture2: new Material(new defs.Textured_Phong(), {
              color: hex_color("#000000"),
              ambient: 1, diffusivity: 0.7, specularity: 1,
              texture: new Texture("assets/amongus.jpg", "NEAREST")
            }),
            ground_texture: new Material(new defs.Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/Grass_1.png", "NEAREST")
            }),
            rock_texture: new Material(new defs.Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.3,
                texture: new Texture("assets/red-rock-texture.jpg", "NEAREST")
            }),
            rope_texture: new Material(new defs.Textured_Phong(), {
                color: hex_color("#964B00"),
                ambient: 0, diffusivity: 0.5, specularity: 1,
            }),
        }

        // Mat4.look_at(eye pos, at point pos, up vector)
        this.initial_camera_location = Mat4.look_at(vec3(0, 3, 30), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("View main scene", ["Control", "0"], () => this.attached = () => null);
        this.new_line();
        this.key_triggered_button("Attach camera to Climber", ["Control", "1"], () => this.attached = () => this.climber_transform);
        this.new_line();
        this.key_triggered_button("Attach camera to Belayer", ["Control", "2"], () => this.attached = () => this.belayer_transform);
        this.new_line();
        this.key_triggered_button("Move sun left", ["j"], () => {
          this.sunX = Math.max(this.sunX - 1, -15);
        });
        this.new_line();
        this.key_triggered_button("Move sun right", ["l"], () => {
          this.sunX = Math.min(this.sunX + 1, 15);
        });
        this.new_line();
        this.key_triggered_button("Make climber fall", ["Shift", "D"], () => {
            if (this.belayer.onFloor()) this.climber.freeFall = true;
        });
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let model_transform = Mat4.identity();

        // draw skybox
        // The parameters of the Light are: position, color, size
        const light_position = vec4(this.sunX, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        const sun_transform = Mat4.identity().times(Mat4.translation(this.sunX,6,10));
        this.shapes.sphere.draw(context, program_state, sun_transform, this.materials.sun);

        model_transform = model_transform.times(Mat4.scale(100, 100, 100));
        this.shapes.box.draw(context, program_state, model_transform, this.materials.texture);
        model_transform = Mat4.identity();

        // draw ground
        model_transform = model_transform.times(Mat4.translation(0,FLOOR_HEIGHT,0).times(Mat4.scale(50,0.1,50)));
        this.shapes.floor.draw(context, program_state, model_transform, this.materials.ground_texture);

        // rock wall
        const rock_transform = Mat4.identity().times(Mat4.translation(0, 0, -2)).times(Mat4.scale(20, 20, 1));
        this.shapes.rockwall.draw(context, program_state, rock_transform, this.materials.rock_texture);

        // finished free fall, transitioning into pulley system
        if (this.climber.freeFall && this.get_distance_between_climber_belayer() >= this.ropeLength &&
            this.climber.body_loc[1] <= this.pulley.position[1]) {
            this.climber.freeFall = false;
            this.belayer.freeFall = false;

            if (this.climber.dV != 0) {
                this.climber.inPulley = true;
                this.belayer.inPulley = true;
                const v = this.calcVelAfterCollision();
                this.belayer.dV = v;
                this.climber.dV = -v;

                const pulleyAcc = this.getPulleyAcc();
                this.climber.tensionForces = -pulleyAcc;
                this.belayer.tensionForces = pulleyAcc;
            }
        }

        // human
        const body_parts = this.climber.getBody();
        this.shapes.among.draw(context, program_state, body_parts[0], this.materials.texture2);

        const belayer_body = this.belayer.getBody();
        this.shapes.among.draw(context, program_state, belayer_body[0], this.materials.texture2);
       
        this.climber.update(dt);
        this.belayer.update(dt);

        this.climber_transform = body_parts[1];  // attach camera to head of climber and not its body
        this.belayer_transform = belayer_body[1];

        // TEST: Rope
        for (let i = 1; i < this.rope.n -1; i++) { // don't draw the anchor points, since the climber and belayer are the anchor points
            const p = this.rope.getPoints()[i];
            this.shapes.sphere.draw(context, program_state, p.transform(), this.materials.rope_texture);
        }

        //camera buttons
        const desired = this.attached;
        if (desired && desired()) {
          program_state.camera_inverse = Mat4.inverse(desired().times(Mat4.rotation(1,-0.5,0,0).times(Mat4.translation(0,-5,20)))).map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.1));
        } else {
          program_state.camera_inverse = this.initial_camera_location.map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.1));
        }

        this.rope.update(dt, this.thrust, this.pulley, FLOOR_HEIGHT);
        this.rope.setAnchors(new Point(this.climber.body_loc), new Point(this.belayer.body_loc));
        this.shapes.teapot.draw(context, program_state, this.pulley.transform(), this.materials.test);
    }

    getPulleyAcc() {
        const mc = this.climber.mass;
        const mb = this.belayer.mass;
        return ((mc - mb) * g - friction * (mc + mb)) / (mc + mb);
    }

    calcVelAfterCollision() {
        const mc = this.climber.mass;
        const mb = this.belayer.mass;
        const vc = Math.abs(this.climber.dV);
        const coll_v = mc * vc / (mc + mb);
        const v = coll_v * (1 - belayerJ) + belayerJ * vc;
        return v;
    }

    get_distance_between_climber_belayer() {
        return this.climber.body_loc.minus(this.pulley.position).norm() + this.pulley.position.minus(this.belayer.body_loc).norm();
    }
}

class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        varying vec4 val;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;

                // Compute an initial (ambient) color:
                val = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                val.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
              gl_FragColor = val;
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = { color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40 };
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}
// class Normal_Map extends Shader {
//   update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
//       // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
//       const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
//           PCM = P.times(C).times(M);
//       context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
//       context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
//           Matrix.flatten_2D_to_1D(PCM.transposed()));
//   }

//   shared_glsl_code() {
//       // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
//       return `
//       precision mediump float;
//       varying vec4 point_position;
//       varying vec4 center;
//       `;
//   }

//   vertex_glsl_code() {
//       // ********* VERTEX SHADER *********
//       // Complete the main function of the vertex shader.
//       return this.shared_glsl_code() + `
//       attribute vec3 position;
//       uniform mat4 model_transform;
//       uniform mat4 projection_camera_model_transform;
//       void main(){

//         texture_coordinates = textcoord;
//         fragment_position = vec3(model * vec4(position,1.0));
     
//         mat3 normalMatrix = transpose(inverse(mat3(model)));
//         vec3 T = normalize(normalMatrix * tangent);
//         vec3 N = normalize(normalMatrix * normal);
//         T = normalize(T - dot(T, N) * N);
//         vec3 B = cross(N, T);
//         mat3 TBN = transpose(mat3(T,B,N));
//         view_position =  TBN * viewPos; // camera position
//         light_position = TBN * lightPos; // light position
//         fragment_position = TBN * fragment_position;
       
//         gl_Position = projection * view * model * vec4(position,1.0);
//      }`;
//   }

//   fragment_glsl_code() {
//       // ********* FRAGMENT SHADER *********
//       // Complete the main function of the fragment shader.
//       return this.shared_glsl_code() + `
//       void main() {
//         vec3 Normal = texture(TextSamplerNormals,texture_coordinates).rgb; // extract normal
//         Normal = normalize(Normal * 2.0 - 1.0); // correct range
//         material_color = texture2D(TextSampler,texture_coordinates.st); // diffuse map
    
//         vec3 I_amb = AmbientLight.color * AmbientLight.intensity;
//         vec3 lightDir = normalize(light_position - fragment_position);
    
//         vec3 I_dif = vec3(0,0,0);
//         float DiffusiveFactor = max(dot(lightDir,Normal),0.0);
//         vec3 I_spe = vec3(0,0,0);
//         float SpecularFactor = 0.0;
    
//         if (DiffusiveFactor>0.0) {
//            I_dif = DiffusiveLight.color * DiffusiveLight.intensity * DiffusiveFactor;
    
//            vec3 vertex_to_eye = normalize(view_position - fragment_position); 
//            vec3 light_reflect = reflect(-lightDir,Normal);
//            light_reflect = normalize(light_reflect);
    
//            SpecularFactor = pow(max(dot(vertex_to_eye,light_reflect),0.0),SpecularLight.power);
//            if (SpecularFactor>0.0)  {
//                I_spe = DiffusiveLight.color * SpecularLight.intensity * SpecularFactor;
//            }
//        }
    
//        color = vec4(material_color.rgb * (I_amb + I_dif + I_spe),material_color.a);
    
//       }`;
//   }
// }

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // Complete the main function of the vertex shader.
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        void main(){
          gl_Position = projection_camera_model_transform * vec4( position, 1.0 );  
          point_position = model_transform * vec4(position, 1.0);    
          center = model_transform * vec4(0, 0, 0, 1.0);      
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // Complete the main function of the fragment shader.
        return this.shared_glsl_code() + `
        void main(){
          vec3 distance = vec3(point_position.xyz - center.xyz);
          vec3 color = vec3(0.69, 0.5, 0.25);
          gl_FragColor = vec4(color, cos(length(distance) * 20.0));
        }`;
    }
}

