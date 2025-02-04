// SceneApp.js

import alfrid, { Scene, GL, TouchDetector } from 'alfrid';
import ViewSave from './ViewSave';
import ViewRender from './ViewRender';
import ViewRenderShadow from './ViewRenderShadow';
import ViewSim from './ViewSim';
import ViewFloor from './ViewFloor';
import ViewCylinder from './ViewCylinder';
import Config from './Config';
import PoseDetection from './PoseDetection';
import ParticleTexture from './ParticleTexture';
import { hitTest, checkBounds } from './utils';

window.getAsset = function(id) {
	return assets.find( (a) => a.id === id).file;
}

class SceneApp extends alfrid.Scene {
	constructor() {
		super();
		GL.enableAlphaBlending();

		this._count = 0;
		this.camera.setPerspective(Math.PI/2, GL.aspectRatio, .1, 100);
		this.orbitalControl.radius.setTo(9);
		this.orbitalControl.radius.value = 10.0;
		this.orbitalControl.ry.easing = 0.01;
		this.orbitalControl.lock();

		this._cameraLight = new alfrid.CameraOrtho();
		const s = Config.range;
		this._cameraLight.ortho(-s, s, -s, s, 1, 50);

		this._cameraLight.lookAt([0, 10, 3], [0, 0, 0]);

		this._biasMatrix = mat4.fromValues(
			0.5, 0.0, 0.0, 0.0,
			0.0, 0.5, 0.0, 0.0,
			0.0, 0.0, 0.5, 0.0,
			0.5, 0.5, 0.5, 1.0
		);
		this._shadowMatrix = mat4.create();
		mat4.multiply(this._shadowMatrix, this._cameraLight.projection, this._cameraLight.viewMatrix);
		mat4.multiply(this._shadowMatrix, this._biasMatrix, this._shadowMatrix);



		this._hit = vec3.create();
		this._detector = new TouchDetector(this._vCylinder.mesh, this.camera);
		this._detector.on('onHit', (e) => {
			vec3.copy(this._hit, e.detail.hit);
		});


		PoseDetection.on('poses', (o)=>this._onPoses(o));

		this._hits = [];
	}

	_initTextures() {
		console.log('init textures');

		//	FBOS
		const numParticles = Config.numParticles;
		const o = {
			minFilter:GL.NEAREST,
			magFilter:GL.NEAREST,
			type:GL.FLOAT
		};

		this._fboCurrent  	= new alfrid.FrameBuffer(numParticles, numParticles, o, 3);
		this._fboTarget  	= new alfrid.FrameBuffer(numParticles, numParticles, o, 3);

		const shadowMapSize = 512;
		this._fboShadow = new alfrid.FrameBuffer(shadowMapSize, shadowMapSize, {minFilter:GL.LINEAR, magFilter:GL.LINEAR});

		this._textureParticle = new ParticleTexture();
	}


	_initViews() {
		console.log('init views');
		
		//	helpers
		this._bCopy = new alfrid.BatchCopy();
		this._bAxis = new alfrid.BatchAxis();
		this._bDots = new alfrid.BatchDotsPlane();
		this._bBall = new alfrid.BatchBall();
		this._vFloor = new ViewFloor();
		this._vCylinder = new ViewCylinder();


		//	views
		this._vRender = new ViewRender();
		this._vRenderShadow = new ViewRenderShadow();
		this._vSim 	  = new ViewSim();

		this._vSave = new ViewSave();
		GL.setMatrices(this.cameraOrtho);


		this._fboCurrent.bind();
		GL.clear(0, 0, 0, 0);
		this._vSave.render();
		this._fboCurrent.unbind();

		this._fboTarget.bind();
		GL.clear(0, 0, 0, 0);
		this._vSave.render();
		this._fboTarget.unbind();

		GL.setMatrices(this.camera);
	}


	_onPoses(poses) {
		const videoWidth = 640;
		const videoHeight = 480;


		const mapPoint = (p) => {
			let x = p.x;
			let y = p.y;

			return {x, y};
		}

		this._hits = [];
		let hit;
		const w2 = GL.width/2;

		let sumX = 0;
		let count = 0;
		poses.forEach( pose => {
			// if(!checkBounds(pose.left)) {
				hit = hitTest( mapPoint(pose.left), this._vCylinder.mesh, this.camera);
				if(hit) {
					this._hits.push(hit);
					sumX += (pose.left.x - w2) / w2;
					count++;
				}
			// }

			// if(!checkBounds(pose.right)) {
				hit = hitTest( mapPoint(pose.right), this._vCylinder.mesh, this.camera);
				if(hit) {
					this._hits.push(hit);
					sumX += (pose.right.x - w2) / w2;
					count ++;
				}
			// }
			
		});

	}


	updateFbo() {
		this._fboTarget.bind();
		GL.clear(0, 0, 0, 0);
		this._vSim.render(
			this._fboCurrent.getTexture(1), 
			this._fboCurrent.getTexture(0), 
			this._fboCurrent.getTexture(2),
			this._hit,
			this._hits
			);
		this._fboTarget.unbind();
		

		let tmp          = this._fboCurrent;
		this._fboCurrent = this._fboTarget;
		this._fboTarget  = tmp;

	}

	_renderParticles() {
		let p = this._count / Config.skipCount;
		this._vRender.render(
			this._fboTarget.getTexture(0), 
			this._fboCurrent.getTexture(0), 
			p, 
			this._fboCurrent.getTexture(2),
			this._shadowMatrix, 
			this._fboShadow.getDepthTexture(),
			this.textureParticle
		);
	}

	_renderShadowMap() {
		this._fboShadow.bind();
		GL.clear(0, 0, 0, 0);
		GL.setMatrices(this._cameraLight);
		let p = this._count / Config.skipCount;
		this._vRenderShadow.render(
			this._fboTarget.getTexture(0), 
			this._fboCurrent.getTexture(0), 
			p, 
			this._fboCurrent.getTexture(2)
		);
		this._fboShadow.unbind();
	}


	render() {

		this._count ++;
		if(this._count % Config.skipCount == 0) {
			this._count = 0;
			this.updateFbo();
		}

		this._renderShadowMap();

		GL.clear(0, 0, 0, 1);
		GL.setMatrices(this.camera);
		// this._bAxis.draw();
		// this._bDots.draw();

		this._renderParticles();
		this._vFloor.render(this._shadowMatrix, this._fboShadow.getDepthTexture());

		// this._vCylinder.render();

		let s = .05;
		// this._bBall.draw(this._hit, [s, s, s], [1, 0, 0]);

		this._hits.forEach(hit=> {
			this._bBall.draw(hit, [s, s, s], [0.75, 0, 0]);
		})


		GL.viewport(0, 0, s, s);
		// this._bCopy.draw(this._fboParticle.getTexture());
		// this._bCopy.draw(this._fboShadow.getDepthTexture());

		// GL.viewport(s, 0, s, s);
		// this._bCopy.draw(this._fboShadow.getTexture());
	}


	resize() {
		const { innerWidth, innerHeight, devicePixelRatio } = window;
		GL.setSize(innerWidth, innerHeight);
		this.camera.setAspectRatio(GL.aspectRatio);
		PoseDetection.resize();
	}


	get textureParticle() {
		return this._textureParticle.getTexture();
	}
}


export default SceneApp;