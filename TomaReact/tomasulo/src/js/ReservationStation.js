class ReservationStation {
  static STATE_IDLE = 1;
  static STATE_ISSUE = 2;
  static STATE_EXECUTE = 3;
  static STATE_WRITE_BACK = 4;

  /**
   * Initializes a new ReservationStation instance.
   * @param {string} name - The name of the reservation station.
   */
  constructor(name) {
    this.name = name;
    this.state = ReservationStation.STATE_IDLE;
    this.parameters = null; // Array to hold parameter values
    this.tags = null; // Array to hold tags associated with parameters
    this.instruction = null; // The instruction assigned to the station
  }

  /**
   * Resets the reservation station to its idle state.
   */
  reset() {
    this.state = ReservationStation.STATE_IDLE;
    this.parameters = null;
    this.tags = null;
    this.instruction = null;
  }

  /**
   * Checks if the reservation station is idle.
   * @returns {boolean} - True if idle, otherwise false.
   */
  isIdle() {
    return this.state === ReservationStation.STATE_IDLE;
  }

  /**
   * Assigns an instruction to the reservation station.
   * @param {object} instruction - The instruction to assign.
   */
  assignInstruction(instruction) {
    this.state = ReservationStation.STATE_ISSUE;
    this.instruction = instruction;
    this.parameters = [];
    this.tags = [];
  }

  /**
   * Updates the state of the reservation station to the next logical state.
   * (This is optional and dependent on how you manage state transitions.)
   */
  advanceState() {
    switch (this.state) {
      case ReservationStation.STATE_IDLE:
        this.state = ReservationStation.STATE_ISSUE;
        break;
      case ReservationStation.STATE_ISSUE:
        this.state = ReservationStation.STATE_EXECUTE;
        break;
      case ReservationStation.STATE_EXECUTE:
        this.state = ReservationStation.STATE_WRITE_BACK;
        break;
      case ReservationStation.STATE_WRITE_BACK:
        this.reset(); // Return to idle after write-back
        break;
      default:
        throw new Error(`Invalid state: ${this.state}`);
    }
  }
}

export default ReservationStation;
