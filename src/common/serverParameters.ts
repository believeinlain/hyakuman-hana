
export type ServerParameters = {
    flowerRange: number, // range at which a player will load/unload flowers from the server
    flowerExclusionRange: number, // how close can two flowers get to each other?
    flowerSpreadInterval: number, // how often (in ms) will flowers update?
    flowerSpreadFraction: number, // what fraction of flowers will likely update?
    maxFlowerUpdates: number // what is the max number of flowers that will update each interval?
}