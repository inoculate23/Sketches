precision highp float;

varying vec3 vColor;

void main(void) {
	if(distance(gl_PointCoord, vec2(.5)) > .5) discard;

	gl_FragColor = vec4(1.0);
}