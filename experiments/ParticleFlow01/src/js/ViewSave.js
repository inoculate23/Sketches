// ViewSave.js

import alfrid, { GL } from 'alfrid';
import vs from 'shaders/save.vert';
import fs from 'shaders/save.frag';
import Config from './Config';
const random = function (min, max) { return min + Math.random() * (max - min);	};

class ViewSave extends alfrid.View {
	
	constructor() {
		super(vs, fs);
	}


	_init() {
		let positions = [];
		let coords = [];
		let indices = []; 
		let extras = [];
		let count = 0;

		// let numParticles = Config.numParticles;
		const { numParticles, maxRadius, range } = Config;
		let totalParticles = numParticles * numParticles;
		console.debug('Total Particles : ', totalParticles);
		let ux, uy;
		const m = mat4.create();

		const getPos = () => {
			let x = random(-range, range);
			let angle = Math.random() * Math.PI * 2;
			let r = Math.sqrt(Math.random()) * maxRadius;
			let y = Math.cos(angle) * r;
			let z = Math.sin(angle) * r;
			return [x, y, z];
		}

		for(let j = 0; j < numParticles; j++) {
			for(let i = 0; i < numParticles; i++) {
				// positions.push([random(-range, range), random(-range, range), random(-range, range)]);
				positions.push(getPos());

				ux = i / numParticles * 2.0 - 1.0 + .5 / numParticles;
				uy = j / numParticles * 2.0 - 1.0 + .5 / numParticles;

				extras.push([Math.random(), Math.random(), Math.random()]);
				coords.push([ux, uy]);
				indices.push(count);
				count ++;

			}
		}


		this.mesh = new alfrid.Mesh(GL.POINTS);
		this.mesh.bufferVertex(positions);
		this.mesh.bufferData(extras, 'aExtra', 3);
		this.mesh.bufferTexCoord(coords);
		this.mesh.bufferIndex(indices);
	}


	render(state = 0) {
		this.shader.bind();
		GL.draw(this.mesh);
	}


}

export default ViewSave;