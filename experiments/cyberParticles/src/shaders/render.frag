precision highp float;

varying vec4 vColor;
varying vec4 vShadowCoord;
uniform sampler2D textureDepth;

#define uMapSize vec2(512.0)

float bias = 0.005;

float rand(vec4 seed4) {
	float dot_product = dot(seed4, vec4(12.9898,78.233,45.164,94.673));
	return fract(sin(dot_product) * 43758.5453);
}

float PCFShadow(sampler2D depths, vec2 size, vec4 shadowCoord) {
	float result = 0.0;
	float bias = 0.005;
	vec2 uv = shadowCoord.xy;
	float count = 0.0;

	for(int x=-1; x<1; x++){
		for(int y=-1; y<1; y++){
			vec2 off = vec2(x,y);
			off /= size;

			float d = texture2D(depths, uv + off).r;
			if(d < shadowCoord.z - bias) {
				result += 1.0;
			}

			count += 1.0;

		}
	}
	return 1.0 -result/count;

}

void main(void) {
	if(distance(gl_PointCoord, vec2(.5)) > .5) discard;

	vec4 shadowCoord = vShadowCoord / vShadowCoord.w;

	vec2 uv = shadowCoord.xy;
	float d = texture2D(textureDepth, uv).r;


#ifdef USE_PCF
	float s = PCFShadow(textureDepth, uMapSize, shadowCoord);
#else
	float s = 1.0;
	if(d < shadowCoord.z - bias) {
		s = 0.0;
	}
#endif
	s = mix(s, 1.0, .25);
	vec4 color = vColor;
	color.rgb *= s;

    gl_FragColor = color;
}