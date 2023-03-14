// License: MIT 
// Author: Denys Vitiaz (arduinka55055 || sudohub team)

// @ts-ignore: Object is possibly 'null'.
// @ts-ignore: Type 'null' is not assignable to type
import * as THREE from 'https://unpkg.com/three/build/three.module.js';
//using THREE.JS, otherwise i'd end up creating yet another 3D engine

/**
    @type HTMLCanvasElement 
*/
let canvas = document.querySelector("#canvas");

//THREE.JS init
const scene = new THREE.Scene();

//tho its 3d, we only use 2d coordinates
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 1;
camera.position.y = 0.5;
camera.position.x = 0.5;
const cursor = new THREE.Vector2(0, 0);


class BSpline extends Array {

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
        //convert to three.js coordinates
        x = x * 2 - 1;
        y = 1 - y * 2;
        x += camera.position.x;
        y += camera.position.y;

        let p = this.pointSelected;
        //if we click - select point
        if (click == 1) {
            let p = this.getIntersection(x, y);
            if (p == null) {
                p = new THREE.Vector3(x, y, 0);
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

}
let spline = new BSpline();
let flower = [
    new THREE.Vector3(0.3871, 0.1353, 0),
    new THREE.Vector3(0.3333, 0.1688, 0),
    new THREE.Vector3(0.4264, 0.3755, 0),
    new THREE.Vector3(0.4032, 0.4017, 0),
    new THREE.Vector3(0.2270, 0.2576, 0),
    new THREE.Vector3(0.1368, 0.3173, 0),
    new THREE.Vector3(0.1484, 0.4308, 0),
    new THREE.Vector3(0.4017, 0.5021, 0),
    new THREE.Vector3(0.4192, 0.5473, 0),
    new THREE.Vector3(0.1804, 0.6666, 0),
    new THREE.Vector3(0.1994, 0.7772, 0),
    new THREE.Vector3(0.2751, 0.8253, 0),
    new THREE.Vector3(0.4570, 0.5895, 0),
    new THREE.Vector3(0.5225, 0.5866, 0),
    new THREE.Vector3(0.6186, 0.8238, 0),
    new THREE.Vector3(0.7161, 0.8355, 0),
    new THREE.Vector3(0.7933, 0.7161, 0),
    new THREE.Vector3(0.5691, 0.5312, 0),
    new THREE.Vector3(0.5953, 0.4788, 0),
    new THREE.Vector3(0.8427, 0.4483, 0),
    new THREE.Vector3(0.8340, 0.3114, 0),
    new THREE.Vector3(0.7510, 0.2576, 0),
    new THREE.Vector3(0.5496, 0.4013, 0),
    new THREE.Vector3(0.5196, 0.3813, 0),
    new THREE.Vector3(0.5065, 0.1280, 0),
    new THREE.Vector3(0.3901, 0.1368, 0),
    new THREE.Vector3(0.3871, 0.1353, 0),
];

for (let p of flower)
    spline.push(p);

const geometry = new THREE.BufferGeometry().setFromPoints(flower);
const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

// Create the final object to add to the scene
const curveObject = new THREE.Line(geometry, material);



//helper to draw points
let geometry2 = new THREE.BufferGeometry().setFromPoints(spline);
let material2 = new THREE.PointsMaterial({ color: 0x0000ff, size: 6 });
const points = new THREE.Points(geometry2, material2);
scene.add(points);
scene.add(curveObject);
const animate = function() {
    const curve = new THREE.CatmullRomCurve3(spline);
    const points = curve.getPoints(document.getElementById('splineprecision').value);
    geometry.setFromPoints(points);
    geometry2.setFromPoints(spline);


    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

animate();


function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.width, canvas.height);
}
resize();
window.addEventListener('resize', resize);
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