// License: MIT 
// Author: Denys Vitiaz (arduinka55055 || sudohub team)

// @ts-ignore: Object is possibly 'null'.
// @ts-ignore: Type 'null' is not assignable to type

/**
    @type HTMLCanvasElement 
*/
let canvas = document.querySelector("#canvas");
/**
    @type WebGLRenderingContext 
*/
let gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
/**
    @type WebGLProgram
*/
const program = gl.createProgram();
const sc = 2;
let cursor = { x: 0, y: 0 };

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class HermiteSpline {

    constructor() {
        this.pointSelected = null;
        this.radius = 0.05;
        this.p0 = new Point(0.1, 0.5);
        this.p1 = new Point(0.8, 0.2);
        this.m0 = new Point(0.2, 0.8);
        this.m1 = new Point(0.65, 0.4);
    }
    getIntersection(x, y) {
        const candidates = [
            this.p0,
            this.p1,
            this.m0,
            this.m1
        ];
        let nearest = Infinity;
        let nearestPoint = null;
        //pick nearest point using pythagoras
        for (let i = 0; i < candidates.length; i++) {
            const p = candidates[i];
            const dist = Math.hypot(p.x - x, p.y - y);
            if (dist < this.radius && dist < nearest) {
                nearest = dist;
                nearestPoint = p;
            }
        }
        return nearestPoint;
    }
    click(x, y, drag, click) {
        x /= canvas.width;
        y /= canvas.height;
        //convert to [-1,1] and flip y
        x = x * 2;
        y = 1 - y * 2;
        let p = this.pointSelected;
        //if we click - select point
        if (click) {
            let p = this.getIntersection(x, y);
            this.pointSelected = p;
        }
        //if we drag - move point
        if (p) {
            console.log("click");
            if (drag) {
                p.x = x;
                p.y = y;
            }
            if (!drag) {
                this.pointSelected = null;
            }
        }
    }
    setUniforms() {
        const candidates = [
            this.p0,
            this.p1,
            this.m0,
            this.m1
        ];
        const p0Location = gl.getUniformLocation(program, "p0");
        gl.uniform2f(p0Location, this.p0.x, this.p0.y);
        const p1Location = gl.getUniformLocation(program, "p1");
        gl.uniform2f(p1Location, this.p1.x, this.p1.y);
        const m0Location = gl.getUniformLocation(program, "m0");
        gl.uniform2f(m0Location, this.m0.x, this.m0.y);
        const m1Location = gl.getUniformLocation(program, "m1");
        gl.uniform2f(m1Location, this.m1.x, this.m1.y);
        //is mouse over point
        const mouseover = gl.getUniformLocation(program, "mouseover");
        //get selected point index
        console.log(candidates.indexOf(this.pointSelected) + 1);
        gl.uniform1i(mouseover, candidates.indexOf(this.pointSelected) + 1);
    }

}

let hermiteSpline = new HermiteSpline();

async function initShader() {
    const fshader = await fetch('shader.frag').then(response => response.text());
    const vshader = await fetch('shader.vert').then(response => response.text());

    let fshaderObj = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fshaderObj, fshader);
    gl.compileShader(fshaderObj);
    let vshaderObj = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vshaderObj, vshader);
    gl.compileShader(vshaderObj);
    gl.attachShader(program, fshaderObj);
    gl.attachShader(program, vshaderObj);

    gl.linkProgram(program);
    gl.useProgram(program);
    //get error
    if (!gl.getShaderParameter(fshaderObj, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fshaderObj));
    }
    if (!gl.getShaderParameter(vshaderObj, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vshaderObj));
    }
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
    }
    //viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    //set resolution
    const resolutionLocation = gl.getUniformLocation(program, "resolution");
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    //enable anti aliasing
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    //enable anti aliasing
    gl.enable(gl.LINE_SMOOTH);
    gl.lineWidth(2);

    return program;
}


function resize() {
    canvas.width = getComputedStyle(canvas).width.replace('px', '') * sc;
    canvas.height = getComputedStyle(canvas).height.replace('px', '') * sc;

    gl.viewport(0, 0, canvas.width, canvas.height);
    //set resolution
    const resolutionLocation = gl.getUniformLocation(program, "resolution");
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();



async function redraw() {
    // get points
    let positions = [0.5, 0.5, 0.5, 0.5];
    // whole canvas
    let screen = [-1, -1, 1, -1, -1, 1, 1, 1];

    //#region create VBOs
    const positionBuffer = gl.createBuffer();
    const pointsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screen), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    //#endregion create VBOs

    // Clear the canvas before we start drawing on it.
    gl.clearColor(0.0, 0.0, 0.0, 0.0); // Clear to black, fully transparent
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //#region uniforms
    //hermite spline uniforms
    hermiteSpline.setUniforms();
    //mouse position
    const mouseLocation = gl.getUniformLocation(program, "mouse");
    gl.uniform2f(mouseLocation, cursor.x / canvas.width * sc, 1 - cursor.y / canvas.height * sc);
    //spline precision
    const splineprecision = document.getElementById('splineprecision').value;
    const precisionLocation = gl.getUniformLocation(program, "splineprecision");
    gl.uniform1f(precisionLocation, splineprecision);
    //time ticks for animation in shader
    const timeLocation = gl.getUniformLocation(program, "time");
    gl.uniform1f(timeLocation, Date.now() / 1000);
    //#endregion uniforms

    //#region VAOs 
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    //vertices are some 3d points but here we use only 2d - all screen
    const vertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
    //set points
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
    const points = gl.getAttribLocation(program, 'points');
    gl.vertexAttribPointer(points, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);
    //#endregion VAOs


    gl.drawArrays(gl.TRIANGLE_STRIP, 0, screen.length / 2);

    requestAnimationFrame(redraw);

}

initShader().then(() => requestAnimationFrame(redraw));



canvas.addEventListener('mousemove', (e) => {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    hermiteSpline.click(cursor.x, cursor.y, e.buttons == 1);
});
canvas.addEventListener('mousedown', (e) => {
    if (e.buttons == 1) {
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
        hermiteSpline.click(cursor.x, cursor.y, e.buttons == 1, true);
    }
});
let touchlistener = (e) => {
    cursor.x = e.touches[0].clientX;
    cursor.y = e.touches[0].clientY;
    requestAnimationFrame(() => {
        redraw();
    });
};
canvas.addEventListener('touchstart', touchlistener);
canvas.addEventListener('touchmove', touchlistener);
canvas.addEventListener('touchend', touchlistener);