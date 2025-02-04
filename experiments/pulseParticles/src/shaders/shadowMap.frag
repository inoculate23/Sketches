// copy.frag

#define SHADER_NAME SIMPLE_TEXTURE

precision highp float;
varying vec4 vColor;

void main(void) {
	if(vColor.a <= 0.0) discard;
	if(distance(gl_PointCoord, vec2(.5)) > .5) discard;
    gl_FragColor = vColor;
}