# version 300 es
layout (location = 0) in vec4 aVertexPosition;
layout (location = 1) in vec2 points;
out vec2 test;

void main() {
    gl_Position = aVertexPosition;
    test = points;
}
