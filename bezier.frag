# version 300 es
#define MAX_POINTS 32
precision mediump float;

layout(std140) uniform Points {
    //vec4 is 16 bytes, GPU screws up vec2
    //and the half of our points magically disappear
    vec4 points[MAX_POINTS];
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

void drawline(vec2 uv, vec2 p0, vec2 p1, vec3 color) {
    float pixel = 1.0 / resolution.x;
    vec2 delta = uv - p0;
    vec2 delta2 = p1 - p0;
    float dotprod = dot(delta, delta2);
    float seglen = dot(delta2, delta2);
    if (dotprod >= 0.0 && dotprod <= seglen) {
        float R = abs(delta.x * delta2.y - delta.y * delta2.x) / length(delta2);
        float a = abs(R / pixel);
        if (R < pixel*5.0)
            fragColor = mix(vec4(color, 1.0),fragColor, a*.2);
    }
}

void bezier(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t, out vec2 pos) {
    float t2 = t * t;
    float t3 = t2 * t;
    float h1 = -t3 + 3.0 * t2 - 3.0 * t + 1.0;
    float h2 = 3.0 * t3 - 6.0 * t2 + 3.0 * t;
    float h3 = -3.0 * t3 + 3.0 * t2;
    float h4 = t3;
    pos = h1 * p0 + h2 * p1 + h3 * p2 + h4 * p3;
   }

//get point from points array
vec2 getPoint(int index){
    if(index < 0) return points[0].xy;
    //4d to 2d lol
    int halfindex = index/2;
    //even - xy, odd - zw
    if(index%2 == 0)
        return points[halfindex].xy;
    else
        return points[halfindex].zw;
}
void main(){
    // uv - current "texture" coordinate
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    //hsv gradient background :)
    vec2 center = vec2(0.5, 0.5);
    vec2 delta = uv - center;
    float r = length(delta);
    float theta = atan(delta.y, delta.x);
    float h = theta / (2.0 * PI) * 360.0;
    float s = r*2.0;
    float v = 1.0;
    vec3 color = hsv2rgb(h, s, v);
    fragColor = vec4(color, 1.0);

    //mouse circle
    drawcircle(uv, mouse, false);

    //draw points
    vec2 prev = points[0].xy;
    for(int i=0;i<MAX_POINTS;i++){
        //no more points
        if(i>=count) break;

        vec2 point = getPoint(i);
        drawcircle(uv, point, i==i);
        drawline(uv, prev, point, vec3(0.7,0.7,0.7));
        prev = point;
    }
    //draw bezier curve
    for(int i=0;i<MAX_POINTS;i+=3){
        //no more points
        if(i+3>=count) break;

        vec2 p0 = getPoint(i);
        vec2 p1 = getPoint(i+1);
        vec2 p2 = getPoint(i+2);
        vec2 p3 = getPoint(i+3);

        vec2 prev = p0;
        float s = 1.0/splineprecision;
        for(float t=s;t<=1.0;t+=s){
            vec2 pos;
            bezier(p0, p1, p2, p3, t, pos);
            drawline(uv, prev, pos, vec3(0.9,0.0,0.0));
            prev = pos;
        }
    }
}
