
import { 
    GroundMesh,
    Mesh,
    MeshBuilder,
    Scene,
    PBRMetallicRoughnessMaterial,
    Texture
} from "@babylonjs/core";

export class Terrain {
    constructor (scene: Scene) {
        let options = {
            width: 1000,
            height: 1000, 
            maxHeight: 20, 
            minHeight: 0, 
            subdivisions: 200,
            updatable: true,
            onReady: Terrain.onReady
        };
        this.ground = MeshBuilder.CreateGroundFromHeightMap(
            'terrain', 
            "./res/tex/hyakuman-terrain_heightmap.png", 
            options, 
            scene
        );
        
        this.ground.checkCollisions = true;

        var material = new PBRMetallicRoughnessMaterial(name+"-material", scene);
        material.baseTexture = new Texture(
            "./res/tex/hyakuman-terrain_diffuse.png", scene);
        material.metallicRoughnessTexture = new Texture(
            "./res/tex/hyakuman-terrain_metallicRoughness.png", scene);
        this.ground.material = material;
    }

    // runs when the ground mesh has been generated from the heightmap
    static onReady(mesh: GroundMesh) {
        mesh.convertToFlatShadedMesh();
    }

    ground: Mesh;
}