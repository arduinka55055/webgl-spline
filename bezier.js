// License: MIT 
// Author: Denys Vitiaz (arduinka55055 || sudohub team)

// @ts-ignore: Object is possibly 'null'.
// @ts-ignore: Type 'null' is not assignable to type

/**
    @type HTMLCanvasElement 
*/
let canvas = document.querySelector("#canvas");
/**
    @type WebGL2RenderingContext 
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

class BezierSpline extends Array {

    constructor() {
        super();
        this.pointSelected = null;
        this.radius = 0.05;
    }
    getIntersection(x, y) {
        let nearest = Infinity;
        let nearestPoint = null;
        //pick nearest point using pythagoras
        for (let i = 0; i < this.length; i++) {
            const p = this[i];
            const dist = Math.hypot(p.x - x, p.y - y);
            if (dist < this.radius && dist < nearest) {
                nearest = dist;
                nearestPoint = p;
            }
        }
        return nearestPoint;
    }
    click(x, y, drag, click) {
        //normalize to [0,1]
        x /= canvas.width;
        y /= canvas.height;
        //convert to [-1,1] and flip y
        x = x * 2;
        y = 1 - y * 2;
        let p = this.pointSelected;
        //if we click - select point
        if (click == 1) {
            let p = this.getIntersection(x, y);
            if (p == null) {
                p = new Point(x, y);
                this.push(p);
            }
            this.pointSelected = p;
        }
        if (click == 2) {
            //right click
            let p = this.getIntersection(x, y);
            if (p != null) {
                this.splice(this.indexOf(p), 1);
            }
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
        //set points count
        const count = gl.getUniformLocation(program, "count");
        gl.uniform1i(count, this.length);
        //is mouse over point
        const mouseover = gl.getUniformLocation(program, "mouseover");
        //get selected point index
        console.log(this.indexOf(this.pointSelected));
        gl.uniform1i(mouseover, this.indexOf(this.pointSelected));
    }
    getPoints() {
        let raw = this.map(p => [p.x, p.y]).flat();
        return new Float32Array(raw);
    }

}

let spline = new BezierSpline();
spline.push(new Point(0.7, 0.4));
spline.push(new Point(0.5, 0.7));
spline.push(new Point(0.3, 0.4));
spline.push(new Point(0.1, 0.7));

let flower = new BezierSpline([
    new Point(0.3871, 0.1353),
    new Point(0.3333, 0.1688),
    new Point(0.4264, 0.3755),
    new Point(0.4032, 0.4017),
    new Point(0.2270, 0.2576),
    new Point(0.1368, 0.3173),
    new Point(0.1484, 0.4308),
    new Point(0.4017, 0.5021),
    new Point(0.4192, 0.5473),
    new Point(0.1804, 0.6666),
    new Point(0.1994, 0.7772),
    new Point(0.2751, 0.8253),
    new Point(0.4570, 0.5895),
    new Point(0.5225, 0.5866),
    new Point(0.6186, 0.8238),
    new Point(0.7161, 0.8355),
    new Point(0.7933, 0.7161),
    new Point(0.5691, 0.5312),
    new Point(0.5953, 0.4788),
    new Point(0.8427, 0.4483),
    new Point(0.8340, 0.3114),
    new Point(0.7510, 0.2576),
    new Point(0.5196, 0.3813),
    new Point(0.5065, 0.1280),
    new Point(0.3901, 0.1368)
]);
spline = flower;
async function initShader() {
    const fshader = await fetch('bezier.frag').then(response => response.text());
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
    //other errors
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
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


//#region create VBOs
const positionBuffer = gl.createBuffer();
const pointsBuffer = gl.createBuffer();
const screenbuf = [-1, -1, 1, -1, -1, 1, 1, 1];
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screenbuf), gl.STATIC_DRAW);
//#endregion create VBOs

async function redraw() {
    // get points
    let positions = spline.getPoints();
    // fill points buffer
    const blockSize = gl.getActiveUniformBlockParameter(program, 0, gl.UNIFORM_BLOCK_DATA_SIZE);
    gl.bindBuffer(gl.UNIFORM_BUFFER, pointsBuffer);
    gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.STATIC_DRAW);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, new Float32Array(positions));
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, pointsBuffer);

    // Clear the canvas before we start drawing on it.
    gl.clearColor(0.0, 0.0, 0.0, 0.0); // Clear to black, fully transparent
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //#region uniforms
    //spline uniforms
    spline.setUniforms();
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
    gl.enableVertexAttribArray(vertexPosition);
    //#endregion VAOs


    gl.drawArrays(gl.TRIANGLE_STRIP, 0, screenbuf.length / 2);

    requestAnimationFrame(redraw);

}

initShader().then(() => requestAnimationFrame(redraw));


//#region events
canvas.addEventListener('mousemove', (e) => {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    spline.click(cursor.x, cursor.y, e.buttons == 1);
});
canvas.addEventListener('mousedown', (e) => {
    if (e.buttons >= 1) {
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
        spline.click(cursor.x, cursor.y, e.buttons == 1, e.buttons);
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
//remove context menu on right click
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
//#endregion events