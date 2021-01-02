
class Gene {
  public readonly value: number; // current value of the gene
  public readonly isLocked: boolean; // is the gene currently locked?

  private readonly min: number; // minimum possible value
  private readonly max: number; // maximum possible value
  private readonly lockChance: number; // how likely the gene is to lock if unlocked (0.0, 1.0)
  private readonly unlockChance: number; // how likely the gene is to unlock if locked (0.0, 1.0)
  private readonly variance: number; // how much the gene is likely to vary on mutation (0.0, 1.0)

  constructor(
      min: number, 
      max: number, 
      lockChance: number, 
      unlockChance: number,
      variance: number, 
      value?: number, 
      isLocked?: boolean) {
    // set gene variance parameters
    this.min = min;
    this.max = max;
    this.lockChance = lockChance;
    this.unlockChance = unlockChance;
    this.variance = variance;
    // if default values are not specified, choose random ones
    if (value === void 0) {
      this.value = Math.random()*(this.max-this.min) + this.min;
    } else {
      this.value = value;
    }
    // whether we start of locked depends on both lockChance and unlockChance
    if (isLocked === void 0) {
      // lock initially based on an even split
      let newIsLocked = Math.random() < 0.5;
      this.isLocked = newIsLocked;
      // then lock or unlock randomly as appropriate
      if (newIsLocked) {
        if (Math.random() < this.unlockChance) {
          this.isLocked = false;
        }
      } else {
        if (Math.random() < this.lockChance) {
          this.isLocked = true;
        }
      }
    } else {
      this.isLocked = isLocked;
    }
  }

  static mutate(geneData: Gene): Gene {
    let newValue = geneData.value;
    let newIsLocked = geneData.isLocked;
    // determine of the locked status of this gene will change this mutation
    if (geneData.isLocked) {
      if (Math.random() < geneData.unlockChance) {
        newIsLocked = false;
      }
    } else {
      if (Math.random() < geneData.lockChance) {
        newIsLocked = true;
      }
    }
    // if the gene is unlocked, vary the value
    if (!newIsLocked) {
      // get the offset to a random new value
      let offset = ( Math.random()*(geneData.max-geneData.min) + geneData.min ) - geneData.value;
      // scale the offset by variance and apply to new value
      newValue = geneData.value + offset*geneData.variance;
    }
    return new Gene(
      geneData.min, 
      geneData.max, 
      geneData.lockChance, 
      geneData.unlockChance, 
      geneData.variance, 
      newValue, 
      newIsLocked);
  }

  static copy(geneData: Gene): Gene {
    return new Gene(
      geneData.min, 
      geneData.max, 
      geneData.lockChance, 
      geneData.unlockChance, 
      geneData.variance, 
      geneData.value, 
      geneData.isLocked);
  }
}

// interface to access parameters by string identifier
interface IRawParams {
  [key: string]: any
}

// used to characterize and mutate variations in flower appearance
export class FlowerGenome implements IRawParams {
  [k: string]: any;

  numPetals: Gene; // integer number of petals
  petalWidth: Gene; // petal width
  petalLength: Gene; // petal length
  flowerClosed: Gene; // 0 is fully open, 1 is fully closed
  teardropShape: Gene; // 0.5 is round, 1 is teardrop towards tip, 0 is teardrop towards base
  petalCurl: Gene; // petal curl around length
  petalTipCurl: Gene; // how much the petal tip curls inward
  petalCenterCurl: Gene; // how much the petal center curls inward
  petalSize: Gene; // how much to scale all petals (0.0, 1.0)
  firstPetalSize: Gene; // how much to scale down only the first petal
  petalHue: Gene; // (0.0, 1.0)
  petalSat: Gene; // (0.0, 1.0)
  petalVib: Gene; // (0.0, 1.0)
  stemLength: Gene; // stem length
  stemThickness: Gene;

  constructor(genes: any = {}) {
    this.numPetals = new Gene(1, 10, 0.1, 0.1, 0.5, genes.numPetals || 5);
    this.petalWidth = new Gene(0.1, 1.0, 0.1, 0.1, 0.5, genes.petalWidth || 0.5);
    this.petalLength = new Gene(0.1, 2.0, 0.1, 0.1, 0.5, genes.petalLength || 1.0);
    this.flowerClosed = new Gene(-0.5, 0.8, 0.1, 0.1, 0.5, genes.flowerClosed || 0.1);
    this.teardropShape = new Gene(0.1, 0.9, 0.1, 0.1, genes.teardropShape || 0.7);
    this.petalCurl = new Gene(-0.5, 0.5, 0.1, 0.1, 0.5, genes.petalCurl || 0.1);
    this.petalTipCurl = new Gene(-0.05, 0.05, 0.1, 0.1, 0.5, genes.petalTipCurl || 0.04);
    this.petalCenterCurl = new Gene(-0.02, 0.02, 0.1, 0.1, 0.5, genes.petalCenterCurl || -0.01);
    this.petalSize = new Gene(0.0, 2.0, 0.1, 0.1, 0.5, genes.petalSize || 1.0);
    this.firstPetalSize = new Gene(0.0, 2.0, 0.1, 0.1, 0.5, genes.firstPetalSize || 1.0);
    this.petalHue = new Gene(0.0, 1.0, 0.1, 0.1, 0.5, genes.petalHue || 0.0);
    this.petalSat = new Gene(0.0, 1.0, 0.1, 0.1, 0.5, genes.petalSat || 0.8);
    this.petalVib = new Gene(0.0, 1.0, 0.1, 0.1, 0.5, genes.petalVib || 0.9);
    this.stemLength = new Gene(1, 3, 0.1, 0.1, 0.5, genes.stemLength || 2.5);
    this.stemThickness = new Gene(0.04, 0.06, 0.1, 0.1, 0.5, genes.stemThickness || 0.05);
  }

  static mutate(genomeData: FlowerGenome): FlowerGenome {
    let newGenes: any = {};
    // mutate properties of type gene into newGenes
    Object.getOwnPropertyNames(this).forEach( (propName: string) => {
      if (genomeData[propName] instanceof Gene) {
        newGenes[propName] = Gene.mutate(genomeData[propName]);
      }
    });
    // create a new genome from the mutated genes
    return new FlowerGenome(newGenes);
  }

  static copy(genomeData: FlowerGenome): FlowerGenome {
    let newGenes: any = {};
    // copy properties of type gene into newGenes
    Object.getOwnPropertyNames(this).forEach( (propName: string) => {
      if (genomeData[propName] instanceof Gene) {
        newGenes[propName] = Gene.copy(genomeData[propName]);
      }
    });
    // create a new genome from the mutated genes
    return new FlowerGenome(newGenes);
  }
}