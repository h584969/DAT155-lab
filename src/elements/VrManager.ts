import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { BoxGeometry, Camera, Mesh, MeshBasicMaterial, Object3D, Vector3, WebGLRenderer, XRGripSpace, XRTargetRaySpace } from "three";
import { Terrain } from './Terrain';


const TEMP_DIR = new Vector3(0,0,0);
const TEMP_V0 = new Vector3(0,0,0);
const TEMP_V1 = new Vector3(0,0,0);

const VEL0 = new Vector3();
const VEL1 = new Vector3();

export default class VRManager{
    renderer: WebGLRenderer;
    worldRoot: Object3D;

    selects: number;
    controller1: XRTargetRaySpace;
    controller0: XRTargetRaySpace;

    old0: Vector3;
    old1: Vector3;

    terrain: Terrain;

    constructor(renderer: WebGLRenderer, scene: Object3D, worldRoot: Object3D, terrain: Terrain){
        this.renderer = renderer;
        const factory = new XRControllerModelFactory();

        const controller0 = renderer.xr.getController(0);
        const controller1 = renderer.xr.getController(1);

        const controllerGrip0 = renderer.xr.getControllerGrip(0);
        const controllerGrip1 = renderer.xr.getControllerGrip(1);
        this.addModel(controllerGrip0, factory);
        this.addModel(controllerGrip1, factory);
        scene.add(controllerGrip0, controllerGrip1);
        this.selects = 0;
        controller0.addEventListener("selectstart",() => {
            this.selects = Math.min(2,this.selects + 1);
        });

        controller0.addEventListener("selectend", () => {
            this.selects = Math.max(0,this.selects - 1);
        });
        
        controller1.addEventListener("selectstart",() => {
            this.selects = Math.min(2,this.selects + 1);
        });

        controller1.addEventListener("selectend", () => {
            this.selects = Math.max(0,this.selects - 1);
        });

        this.controller0 = controller0;
        this.controller1 = controller1;

        this.old0 = controller0.getWorldPosition(new Vector3());
        this.old1 = controller0.getWorldPosition(new Vector3());
        this.worldRoot = worldRoot;
        this.terrain = terrain;
    }

    update(){

        const p0 = this.controller0.getWorldPosition(TEMP_V0);
        const p1 = this.controller1.getWorldPosition(TEMP_V1);

        const v0 = VEL0.subVectors(p0, this.old0); 
        const v1 = VEL1.subVectors(p1, this.old1);

        this.old0.copy(p0);
        this.old1.copy(p1);

        if (this.selects > 0){
            const direction = this.renderer.xr.getCamera()
            .getWorldDirection(TEMP_DIR);

            const m0 = direction.dot(v0);
            const m1 = direction.dot(v1);
            
            const m = Math.abs(m0) + Math.abs(m1);


            TEMP_DIR.y = 0;
            TEMP_DIR.normalize();

            this.worldRoot.translateOnAxis(TEMP_DIR.negate(),m);
            const y = this.worldRoot.position.y;

            const texelX = ((-this.worldRoot.position.x + 200) / 400) * 256;
            const texelZ = ((-this.worldRoot.position.z + 200) / 400) * 256;

            this.worldRoot.position.y = -this.terrain.geometry.getHeightInterpolated(texelX, texelZ) ?? y;
        }
    }
    addModel(controllerGrip: XRGripSpace, factory: XRControllerModelFactory){
        const model = factory.createControllerModel(controllerGrip);
        controllerGrip.add(model);
        return model;
    }
}