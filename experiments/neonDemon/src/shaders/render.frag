precision highp float;
varying vec4 vColor;

void main(void) {
	if(distance(gl_PointCoord, vec2(.5)) > .5) discard;
	if(length(vColor.rgb) < .1) discard;
    gl_FragColor = vColor;
 }