
import { 
    Scene,
    UniversalCamera,
    Vector2,
    Vector3
} from "@babylonjs/core";
// import { FlowerGenome } from "../common/flowerGenome";
// import { FlowerPacket } from "../common/flowerPacket";

// import { Flower } from "./flower";

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
    
    camera: UniversalCamera;
    scene: Scene;
    latestPositionUpdate: Vector3;
    updateThreshold: number;
    // heldFlower: Flower;

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

        // this.heldFlower = new Flower(new FlowerPacket('heldFlower', {x:0, y:0}), scene);
        // this.heldFlower.mesh.setAbsolutePosition(position.add(new Vector3(0.5, -1.0, 2.0)));
        // this.heldFlower.mesh.setParent(this.camera);
    }

    // plantFlower(point: Vector3): Flower {
    //     // create a new flower instance with the genome of the held flower
    //     return Flower.createNewInstance(this.heldFlower.instance.genome, point, this.scene);
    // }

    // pickFlower(genome: FlowerGenome) {
    //     this.heldFlower.regenerateFromGenome(genome);
    //     this.heldFlower.mesh.setParent(this.camera);
    // }

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
}