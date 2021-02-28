
import {
    Scene,
    Mesh,
    VertexData,
    Vector3,
    Quaternion,
    Ray
} from "@babylonjs/core";

import { FlowerData, MeshData } from '../common/flowerData';

export class Flower {
    scene: Scene;
    babylon_mesh: Mesh;

    constructor(data: FlowerData, scene: Scene) {
        this.scene = scene;
        // Find a position on the terrain for this flower
        let position = new Vector3(data.location.x, 25, data.location.y);
        let ray = new Ray(position, Vector3.Down(), 100);
        let pickInfo = scene.pickWithRay(ray, mesh => mesh.name == 'terrain');
        if (pickInfo.hit) {
            position = pickInfo.pickedPoint.clone();
        } else {
            console.log("ERROR: could not find terrain when placing flower");
        }

        this.loadMeshIntoScene(data.mesh, data._id);

        this.babylon_mesh.setAbsolutePosition(position);
    }

    loadMeshIntoScene(mesh: MeshData, name: string) {
        // remember current mesh position if applicable before reloading
        let newTransform = null;
        if (this.babylon_mesh) {
            newTransform = this.babylon_mesh.getWorldMatrix();
            this.babylon_mesh.dispose();
        }

        // Create Babylon.js mesh
        this.babylon_mesh = new Mesh(name, this.scene);

        let vertexData = new VertexData();
        vertexData.positions = mesh.positions;
        vertexData.indices = mesh.indices;
        vertexData.colors = mesh.colors;
        vertexData.uvs = mesh.uvs;
        vertexData.normals = mesh.normals;

        vertexData.applyToMesh(this.babylon_mesh);

        // restore mesh position if necessary
        if (newTransform) {
            var quatRotation = new Quaternion();
            var position = new Vector3();
            var scale = new Vector3();

            newTransform.decompose(scale, quatRotation, position);

            this.babylon_mesh.setAbsolutePosition(position);
            this.babylon_mesh.rotationQuaternion = quatRotation;
        }
    }
};