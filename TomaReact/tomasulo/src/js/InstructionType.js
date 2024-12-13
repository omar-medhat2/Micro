class InstructionType {
  static PARAMETER_TYPE_REGISTER = 0;
  static PARAMETER_TYPE_ADDRESS = 1;

  /**
   * Initializes a new InstructionType instance.
   * @param {string} name - The name of the instruction type.
   * @param {number} cycles - The number of cycles the instruction takes to execute.
   * @param {number} destParameter - The index of the destination parameter.
   * @param {Array<number>} parameters - Array representing parameter types.
   * @param {Function} calculate - Function to compute the result of the instruction.
   * @param {Array<Object>} stations - Array of reservation stations for this instruction type.
   */
  constructor(name, cycles, destParameter, parameters, calculate, stations) {
    this.name = name; // Name of the instruction type
    this.cycles = cycles; // Execution time in cycles
    this.destParameter = destParameter; // Index of the destination parameter
    this.parameters = parameters; // Parameter types array
    this.calculate = calculate; // Function to compute results
    this.stations = stations; // Associated reservation stations
  }

  /**
   * Checks if the parameter at a given index is of type register.
   * @param {number} index - The parameter index to check.
   * @returns {boolean} - True if the parameter is a register type.
   */
  isRegisterParameter(index) {
    return this.parameters[index] === InstructionType.PARAMETER_TYPE_REGISTER;
  }

  /**
   * Checks if the parameter at a given index is of type address.
   * @param {number} index - The parameter index to check.
   * @returns {boolean} - True if the parameter is an address type.
   */
  isAddressParameter(index) {
    return this.parameters[index] === InstructionType.PARAMETER_TYPE_ADDRESS;
  }

  /**
   * Executes the `calculate` function with the provided parameters.
   * @param {Array} params - The parameters to pass to the calculate function.
   * @returns {*} - The result of the calculation.
   */
  execute(params) {
    if (typeof this.calculate !== "function") {
      throw new Error(`InstructionType "${this.name}" has no valid calculate function.`);
    }
    return this.calculate(params);
  }
}

export default InstructionType;
