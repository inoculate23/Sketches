// shadow.vert

precision highp float;
attribute vec3 aVertexPosition;
attribute vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uShadowMatrix;

uniform sampler2D textureCurr;
uniform sampler2D textureNext;
uniform sampler2D textureExtra;
uniform float percent;
uniform float time;
uniform float isShadow;
uniform vec2 uViewport;

varying vec4 vShadowCoord;
varying vec4 vColor;
varying vec3 vNormal;

const float radius = 0.01;
const mat4 biasMatrix = mat4( 0.5, 0.0, 0.0, 0.0,
							  0.0, 0.5, 0.0, 0.0,
							  0.0, 0.0, 0.5, 0.0,
							  0.5, 0.5, 0.5, 1.0 );

void main(void) {
	vec2 uv      = aVertexPosition.xy;
	vec3 posCurr = texture2D(textureCurr, uv).rgb;
	vec3 posNext = texture2D(textureNext, uv).rgb;
	vec3 pos     = mix(posCurr, posNext, percent);
	vec3 extra   = texture2D(textureExtra, uv).rgb;
	gl_Position  = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(pos, 1.0);
	
	float g 	 = mix(extra.g, 1.0, .8);	
	vColor       = vec4(vec3(g), 1.0);

	float distOffset = uViewport.y * uProjectionMatrix[1][1] * radius / gl_Position.w;
	gl_PointSize = distOffset * (1.0 + extra.x * 1.0);	
	
	vShadowCoord  = ( biasMatrix * uShadowMatrix ) * vec4(pos, 1.0);;
	vNormal 	 = aNormal;
}