
import { 
    //ICameraInput,
    Scene,
    UniversalCamera,
    Vector2,
    Vector3
} from "@babylonjs/core";

// TODO: Actually implement custom camera controls
// class FirstPersonCameraInput implements ICameraInput<UniversalCamera> {
//     camera: UniversalCamera;

//     getClassName(): string {
//         return "FirstPersonCamera";
//     }

//     getSimpleName(): string {
//         return "firstpersoncamera";
//     }

//     attachControl(noPreventDefault?: boolean): void {
//     }

//     detachControl(): void {

//     }
// }

export class Player {
    constructor (name: string, position: Vector3, scene: Scene) {
        this.camera = new UniversalCamera(name, position, scene);
        this.camera.applyGravity = true;
        this.camera.checkCollisions = true;
        this.camera.ellipsoid = new Vector3(1, 1, 1);
        this.camera.keysUp = [87]; // w
        this.camera.keysLeft = [65]; // a
        this.camera.keysDown = [83]; // s
        this.camera.keysRight = [68]; // d
        this.camera.speed = 0.5;
        this.camera.angularSensibility = 500.0;
        this.camera.inertia = 0.3;

        this.scene = scene;

        this.latestPositionUpdate = position.clone();
        this.updateThreshold = 10.0;
    }

    movedPastThreshold(): boolean {
        let newPosition = this.camera.globalPosition;
        if (newPosition.subtract(this.latestPositionUpdate).lengthSquared() > this.updateThreshold) {
            this.latestPositionUpdate = newPosition.clone();
            return true;
        }
        return false;
    }

    isPointWithinRange(x:number, y:number, range:number): boolean {
        let pt1 = new Vector2(x, y);
        let pt2 = new Vector2(this.camera.globalPosition.x, this.camera.globalPosition.z);
        return pt1.subtract(pt2).lengthSquared() < range**2;
    }

    camera: UniversalCamera;
    scene: Scene;
    latestPositionUpdate: Vector3;
    updateThreshold: number;
}