// @ts-ignore: Object is possibly 'null'.

/**
    @type HTMLCanvasElement 
*/
let canvas = document.querySelector("#canvas");
/**
    @type WebGLRenderingContext 
*/
let gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
const program = gl.createProgram();
const sc = 2;
let cursor = { x: 0, y: 0 };
let chosenColor = [0, 0, 0, 0];

let pointSelected = null;
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class HermitePoint extends Point {
    constructor(x, y, dx, dy) {
        super(x, y);
        this.dx = dx;
        this.dy = dy;
    }
}

class HermiteSpline extends Array {
    radius = 0.05;
    constructor() {
        super();
    }
    getIntersection(x, y) {
        for (let i = 0; i < this.length; i++) {
            const p = this[i];
            if (Math.hypot(p.x - x, p.y - y) < this.radius) {
                return p;
            }
        }
        return null;
    }
    click(x, y, button) {
        let p = this.getIntersection(x, y);
        if (button == 0) {
            if (p == null) {
                //create new point
                p = new HermitePoint(x, y, 0, 0);
                this.push(p);
            }
            //select point
            pointSelected = p;
        } else {
            //delete point
            if (p != null) {
                this.splice(this.indexOf(p), 1);
            }
        }
    }

}

let hermiteSpline = new HermiteSpline();
hermiteSpline.push(new HermitePoint(0, 0, 0, 0));
hermiteSpline.push(new HermitePoint(1, 1, 0, 0));

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
    //render all canvas, not limited by vertices


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
    let positions = [];
    // whole canvas
    let screen = [-1, -1, 1, -1, -1, 1, 1, 1];

    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        positions.push(x, y);
    }

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
    //mouse position
    const mouseLocation = gl.getUniformLocation(program, "mouse");
    gl.uniform2f(mouseLocation, cursor.x / canvas.width * sc, 1 - cursor.y / canvas.height * sc);
    //spline precision
    const hsvLocation = gl.getUniformLocation(program, "splineprecision");
    gl.uniform1f(hsvLocation, 100);
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



function getColorAt(x, y) {
    const pixel = new Uint8Array(16);
    gl.readPixels(x * sc, canvas.height - y * sc, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    //pixel[3] = 1;
    return pixel;
}



canvas.addEventListener('mousemove', (e) => {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
});
canvas.addEventListener('mousedown', (e) => {
    if (e.buttons == 1) {
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
        requestAnimationFrame(() => {
            redraw();
        });
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