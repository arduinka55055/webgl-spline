# version 300 es
#define MAX_POINTS 32
precision mediump float;

layout(std140) uniform Points {
    vec2 points[MAX_POINTS];
};

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform float splineprecision;//amount of points to draw spline
//spline points length
uniform int count;
//index of selected point
uniform int mouseover;

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

void drawcircle(vec2 uv, vec2 pos, bool selected) {
    float pixel = 1.0 / resolution.x;
    vec2 delta = uv - pos;
    float R = length(delta);
    vec3 color = vec3(0, 0, 0);
    if (selected == true) color = vec3(1, 0, 0);

    if (R < pixel*15.0 && R > pixel*8.0)
        fragColor = ablend(vec4(color, 1.0-R*70.0),fragColor);
}

void drawsquare(vec2 uv, vec2 pos, bool selected) {
    float pixel = 1.0 / resolution.x;
    vec2 delta = uv - pos;
    bool R = abs(delta.x) < pixel*15.0 && abs(delta.y) < pixel*15.0;
    R = R && !(abs(delta.x) < pixel*8.0 && abs(delta.y) < pixel*8.0);

    vec3 color = vec3(0, 0, 0);
    if (selected == true) color = vec3(1, 0, 0);
    if (R == true)
        fragColor = vec4(color, 1.0);
}

void drawline(vec2 uv, vec2 p0, vec2 p1) {
    float pixel = 1.0 / resolution.x;
    vec2 delta = uv - p0;
    vec2 delta2 = p1 - p0;
    float dotprod = dot(delta, delta2);
    float seglen = dot(delta2, delta2);
    if (dotprod > 0.0 && dotprod < seglen) {
        float R = abs(delta.x * delta2.y - delta.y * delta2.x) / length(delta2);
        if (R < pixel*5.0)
            fragColor = ablend(vec4(0, 0, 0, 1.0-R*200.0),fragColor);
    }
}

void hermite(vec2 p0, vec2 p1, vec2 m0, vec2 m1, float t, out vec2 pos, out vec2 tan) {
    float t2 = t * t;
    float t3 = t2 * t;
    float h1 = 2.0 * t3 - 3.0 * t2 + 1.0;
    float h2 = -2.0 * t3 + 3.0 * t2;
    float h3 = t3 - 2.0 * t2 + t;
    float h4 = t3 - t2;
    pos = h1 * p0 + h2 * p1 + h3 * m0 + h4 * m1;
    tan = (3.0 * h1 - 2.0 * h3) * p0 + (3.0 * h2 - 2.0 * h4) * p1 + (h3 - h1) * m0 + (h4 - h2) * m1;
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
    
    drawcircle(uv, mouse, false);
    for(int i=0;i<MAX_POINTS;i++){
        if(i>=count) break;
        vec2 p = points[i].xy;
        //vec2 q = points[i].zw;

        float ii = float(i);
        drawcircle(uv, p, 1==1);
        //drawsquare(uv, q+vec2(0.5,0.1*ii), 1==1);
    }
    
}
