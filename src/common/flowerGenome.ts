
const geneMutationParameters = {
  'default': { // all parameter defaults
    min: 0.0, // minimum possible value
    max: 1.0, // maximum possible value
    lockChance: 0.1, // how likely the gene is to lock if unlocked (0.0, 1.0)
    unlockChance: 0.1, // how likely the gene is to unlock if locked (0.0, 1.0)
    variance: 0.1, // how much the gene is likely to vary on mutation (0.0, 1.0)
    defaultValue: 1.0 // default value for the parameter to start at
  },
  'numPetals': { // integer number of petals
    min: 1, 
    max: 10, 
    variance: 0.5,
    defaultValue: 5
  },
  'petalWidth': { // petal width
    min: 0.1, 
    defaultValue: 0.5
  },
  'petalLength': { // petal length
    min: 0.1, 
    max: 2.0, 
  },
  'flowerClosed': { // 0 is fully open, 1 is fully closed
    min: -0.5, 
    max: 0.8, 
    defaultValue: 0.1
  },
  'teardropShape': { // 0.5 is round, 1 is teardrop towards tip, 0 is teardrop towards base
    min: 0.1, 
    max: 0.9, 
    defaultValue: 0.7
  },
  'petalCurl': { // petal curl around length
    min: -0.5, 
    max: 0.5, 
    defaultValue: 0.1
  },
  'petalTipCurl': { // how much the petal tip curls inward
    min: -0.05, 
    max: 0.05, 
    defaultValue: 0.04
  },
  'petalCenterCurl': { // how much the petal center curls inward
    min: -0.02, 
    max: 0.02, 
    defaultValue: -0.01
  },
  'petalSize': { // how much to scale all petals (0.0, 1.0)
    max: 2.0, 
  },
  'firstPetalSize': { // how much to scale down only the first petal
    max: 2.0, 
  },
  'petalHue': {
    defaultValue: 0.0
  },
  'petalSat': {
    defaultValue: 0.8
  },
  'petalVib': {
    defaultValue: 0.9
  },
  'stemLength': { // stem length
    min: 1.0, 
    max: 3.0, 
    defaultValue: 2.5
  },
  'stemThickness': {
    min: 0.04, 
    max: 0.06, 
    defaultValue: 0.05
  }
};

class Gene {
  public readonly name: string; // name of the gene
  public readonly value: number; // current value of the gene
  public readonly isLocked: boolean; // is the gene currently locked?

  constructor(name: string, value?: number, isLocked?: boolean) {
    this.name = name;

    // get gene variance parameters
    let mutationParams = geneMutationParameters[name];
    let defaultParams = geneMutationParameters.default;
    let min = mutationParams.min || defaultParams.min;
    let max = mutationParams.max || defaultParams.max;
    let lockChance = mutationParams.lockChance || defaultParams.lockChance;
    let unlockChance = mutationParams.unlockChance || defaultParams.unlockChance;

    // if default values are not specified, choose random ones
    if (value === void 0) {
      this.value = Math.random()*(max-min) + min;
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
        if (Math.random() < unlockChance) {
          this.isLocked = false;
        }
      } else {
        if (Math.random() < lockChance) {
          this.isLocked = true;
        }
      }
    } else {
      this.isLocked = isLocked;
    }
  }

  static mutate(geneData: Gene): Gene {
    //console.log("Mutated gene", geneData.name);
    // get gene variance parameters
    let mutationParams = geneMutationParameters[geneData.name];
    let defaultParams = geneMutationParameters.default;
    let min = mutationParams.min || defaultParams.min;
    let max = mutationParams.max || defaultParams.max;
    let lockChance = mutationParams.lockChance || defaultParams.lockChance;
    let unlockChance = mutationParams.unlockChance || defaultParams.unlockChance;
    let variance = mutationParams.variance || defaultParams.variance;

    let newValue = geneData.value;
    // if the gene is unlocked, vary the value
    if (!geneData.isLocked) {
      // get the offset to a random new value
      let offset = ( Math.random()*(max-min) + min ) - geneData.value;
      // scale the offset by variance and apply to new value
      newValue = geneData.value + offset*variance;
    }
    
    // determine of the locked status of this gene will change this mutation
    let newIsLocked = geneData.isLocked;
    if (geneData.isLocked) {
      if (Math.random() < unlockChance) {
        newIsLocked = false;
      }
    } else {
      if (Math.random() < lockChance) {
        newIsLocked = true;
      }
    }
    
    return new Gene(geneData.name, newValue, newIsLocked);
  }

  static copy(geneData: Gene): Gene {
    return new Gene(geneData.name, geneData.value, geneData.isLocked);
  }
}

// interface to access genes by string identifier (sequence may be incomplete)
interface GeneSequence {
  [key: string]: Gene
}

// used to characterize and mutate variations in flower appearance
export class FlowerGenome implements GeneSequence {
  [k: string]: Gene;

  constructor(genes?: GeneSequence) {
    // initialize genes from geneMutationParameters to ensure a complete sequence
    Object.getOwnPropertyNames(geneMutationParameters).forEach( (propName: string) => {
      if (propName != 'default') {
        if (genes != void 0 && genes.hasOwnProperty(propName)) {
          // if provided, get the gene from the GeneSequence
          this[propName] = new Gene(propName, genes[propName].value, genes[propName].isLocked);
        } else {
          // else create new gene with default value (maybe randomize instead?)
          let defaultValue = geneMutationParameters[propName].defaultValue 
            || geneMutationParameters.default.defaultValue;
          this[propName] = new Gene(propName, defaultValue);
        }
      }
    });
  }

  static mutate(genomeData: FlowerGenome): FlowerGenome {
    //console.log("Mutated genome");
    let newGenes: GeneSequence = {};
    // mutate properties of type gene into newGenes
    Object.getOwnPropertyNames(genomeData).forEach( (propName: string) => {
      newGenes[propName] = Gene.mutate(genomeData[propName]);
    });
    // create a new genome from the mutated genes
    return new FlowerGenome(newGenes);
  }

  static copy(genomeData: FlowerGenome): FlowerGenome {
    let newGenes: GeneSequence = {};
    // copy properties of type gene into newGenes
    Object.getOwnPropertyNames(genomeData).forEach( (propName: string) => {
      newGenes[propName] = Gene.copy(genomeData[propName]);
    });
    // create a new genome from the mutated genes
    return new FlowerGenome(newGenes);
  }
}