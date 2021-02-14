
import { 
    Scene,
    SolidParticleSystem,
    MeshBuilder,
    Vector3,
    Mesh
} from "@babylonjs/core";

import { FlowerLocations } from '../common/flowerLocations';
import { FlowerPacket } from '../common/flowerPacket';
import { Flower, FlowerGeometry } from './flower';

export class FlowerField {
    
    locations: FlowerLocations;
    pointMap: any;
    scene: Scene;
    SPS: SolidParticleSystem;

    geometry: any;
    flowers: Map<string, Flower>;

    constructor(scene: Scene) {
        this.locations = new FlowerLocations();
        this.scene = scene;
        this.SPS = new SolidParticleSystem("flowerParticles", scene, {
            updatable: true,
            isPickable: true,
            expandable: true
        });
        this.flowers = new Map<string, Flower>();

        this.geometry = {
            stem: MeshBuilder.ExtrudeShapeCustom(
                'stem', 
                {
                    shape: FlowerGeometry.stem.shape,
                    path:FlowerGeometry.stem.path,
                    cap: Mesh.NO_CAP
                })
        }
    }

    // add new flowers to the field and remove replaced flowers
    addFlowers(flowerPackets: FlowerPacket[], exclusionRange: number = 0): void {
        // don't add flowers that already exist
        let newFlowers = flowerPackets.filter( (packet) => !this.locations.hasFlower(packet.id) );
        let n = newFlowers.length;
        let newStemIndex = this.SPS.nbParticles;

        // add geometry to particle system
        this.SPS.addShape(this.geometry.stem, n);

        // finally builds and displays the SPS mesh
        this.SPS.buildMesh();

        // add flowers to scene
        for (let i=0; i<n; i++) {
            let flower = new Flower(newFlowers[i], this.scene);
            flower.stemIndex = newStemIndex+i;
            this.flowers.set(newFlowers[i].id, flower);
            this.SPS.particles[flower.stemIndex].position = flower.rootPosition;
        }

        // Add flowers to the quadtree
        this.locations.addFlowers(newFlowers, exclusionRange);

        // Update SPS mesh
        this.SPS.setParticles();

        // Always show (set this here since it won't work with 0 flowers)
        this.SPS.isAlwaysVisible = true;
    }

    hasFlower(flowerID: string): boolean {
        return this.locations.hasFlower(flowerID);
    }

    getAllFlowerIDs(): string[] {
        return this.locations.getAllFlowerIDs();
    }

    // remove a list of flowers by name
    removeFlowers(flowerIDs: string[]): void {
        let n=0;
        flowerIDs.forEach( (id) => {
            if (this.flowers.has(id)) {
                // TODO: remove more than one at a time
                n++;
                this.SPS.removeParticles(this.flowers.get(id).stemIndex, this.flowers.get(id).stemIndex);
                this.flowers.delete(id);
            }
            this.locations.removeFlower(id);
        });
        // reconstruct the mesh
        this.SPS.buildMesh();
        // Update SPS mesh
        this.SPS.setParticles();
    }

    // fetch only the flowers in a circle around the specified point
    getFlowersAroundPoint(x: number, y: number, radius: number): string[] {
        return this.locations.getFlowersAroundPoint(x, y, radius);
    }

    // remove all flowers outside the circle
    // return list of flowers removed by name
    removeFlowersNotAroundPoint(x: number, y: number, radius: number): string[] {
        return this.locations.removeFlowersNotAroundPoint(x, y, radius);
    }
}