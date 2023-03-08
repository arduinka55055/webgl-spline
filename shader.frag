# version 300 es
precision mediump float;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform float splineprecision;
in vec2 test;
out vec4 fragColor;
const float PI = 3.1415926535897932384626433832795;


vec3 hsv2rgb(float h, float s, float v) {
    float f = mod(h / 60.0, 6.0);
    float p = v * (1.0 - s);
    float q = v * (1.0 - s * (f - floor(f)));
    float t = v * (1.0 - s * (1.0 - (f - floor(f))));
    if (f < 1.0) return vec3(v, t, p);
    else if (f < 2.0) return vec3(q, v, p);
    else if (f < 3.0) return vec3(p, v, t);
    else if (f < 4.0) return vec3(p, q, v);
    else if (f < 5.0) return vec3(t, p, v);
    else return vec3(v, p, q);
}
vec4 ablend(vec4 a, vec4 b) {
    return vec4(a.rgb + b.rgb * (1.0 - a.a), a.a + b.a * (1.0 - a.a));
}
void drawcircle(vec2 uv, vec2 pos) {
    float pixel = 1.0 / resolution.x;
    vec2 delta = uv - pos;
    float R = length(delta);

    if (R < pixel*15.0 && R > pixel*8.0)
        fragColor = ablend(vec4(0, 0, 0, 1.0-R*70.0),fragColor);
}
void main(){
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 center = vec2(0.5, 0.5);
    vec2 delta = uv - center;
    float r = length(delta);
    float theta = atan(delta.y, delta.x);
    float h = theta / (2.0 * PI) * 360.0;
    float s = r*2.0;
    float v = 1.0;
    vec3 color = hsv2rgb(h, s, v);
    fragColor = vec4(color, 1.0);
    //gl_FragColor = vec4(0,0,0,1.0);
    //mouse circle
    
    drawcircle(uv, mouse+vec2(0.0,0.1));
    
        drawcircle(uv, test);
    
}
void maind() {
    // calculate distance from the center of the circle
    vec2 delta = gl_FragCoord.xy - resolution / 2.0;
    float distance = length(delta);

    // draw the circle
    if (distance < 50.0) { // adjust radius as needed
        fragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        discard;
    }
}