class Instruction {
  static id = 0;

  constructor(type, parameters) {
    this.id = ++Instruction.id;
    this.type = type;
    this.time = type.cycles;
    this.parameters = parameters;
    this.issueTime = -1;
    this.executeTime = -1;
    this.writeBackTime = -1;
  }

  static resetID() {
    Instruction.id = 0;
  }
}

export default Instruction;
