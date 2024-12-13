
import Memory from "../js/Memory";
import ReservationStation from "../js/ReservationStation";

export const init = (program, options) => {
    // Parse the program
    const instructions = parseProgram(program);
    
    // Initialize system components
    const memory = new Memory(options.memorySize);
    const registers = new RegisterFile();
    const reservationStations = new ReservationStation(options.stationConfig);
    const cache = new Cache(options.cacheConfig);
  
    // Return the initialized system object
    return {
      program: instructions,
      memory,
      registers,
      reservationStations,
      cache,
      options,
      clock: 0, // Global clock
      step() {
        // Logic to progress simulation by one step
      },
      run() {
        // Logic to run the simulation to completion
      },
    };
  };
  
  // Utility function to parse the program
  const parseProgram = (program) => {
    return program.split("\n").map((line) => new Instruction(line));
  };
  