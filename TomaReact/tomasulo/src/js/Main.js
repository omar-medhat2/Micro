import ReservationStation from "./ReservationStation";
import InstructionType from "./InstructionType";

class Main {
  step() {
    this.system.clock++;

    if (this.instructions.length > this.issuedInstructions) {
      const instruction = this.instructions[this.issuedInstructions];
      const stations = instruction.type.stations;

      for (const station of stations) {
        if (station.state === ReservationStation.STATE_IDLE) {
          station.state = ReservationStation.STATE_ISSUE;
          station.instruction = instruction;
          instruction.issueTime = this.system.clock;

          const dest = instruction.type.destParameter;
          const paramCount = instruction.type.parameters.length;

          station.parameters = [];
          station.tags = [];

          for (let i = 0; i < paramCount; i++) {
            let value = null;
            let tag = null;

            if (i !== dest) {
              switch (instruction.type.parameters[i]) {
                case InstructionType.PARAMETER_TYPE_REGISTER:
                  tag = this.system.commonDataBus.getBusy(
                    InstructionType.PARAMETER_TYPE_REGISTER,
                    instruction.parameters[i]
                  );
                  if (tag === null) {
                    value = this.system.registerFile.get(
                      instruction.parameters[i]
                    );
                  }
                  break;

                case InstructionType.PARAMETER_TYPE_ADDRESS:
                  tag = this.system.commonDataBus.getBusy(
                    InstructionType.PARAMETER_TYPE_ADDRESS,
                    instruction.parameters[i]
                  );
                  value = instruction.parameters[i];
                  break;

                default:
                  break;
              }
            } else {
              // Destination parameter
              value = instruction.parameters[i];
            }

            station.parameters.push(value);
            station.tags.push(tag);
          }

          const type = instruction.type.parameters[dest];
          const name = instruction.parameters[dest];
          this.system.commonDataBus.setBusy(type, name, station);

          this.issuedInstructions++;
          break; // Only issue one instruction per step
        }
      }
    }

    // Process reservation stations
    for (const station of this.system.reservationStations) {
      if (station.state === ReservationStation.STATE_EXECUTE) {
        if (--station.instruction.time === 0) {
          station.instruction.executeTime = this.system.clock;
          station.state = ReservationStation.STATE_WRITE_BACK;
        }
      } else if (station.state === ReservationStation.STATE_WRITE_BACK) {
        const dest = station.instruction.type.destParameter;
        const type = station.instruction.type.parameters[dest];
        const name = station.instruction.parameters[dest];
        let value = station.instruction.type.calculate.call(
          station,
          station.parameters
        );
        if (typeof value === "undefined") {
          value = true;
        }

        if (this.system.commonDataBus.getBusy(type, name) === station) {
          switch (type) {
            case InstructionType.PARAMETER_TYPE_REGISTER:
              this.system.registerFile.set(name, value);
              break;

            case InstructionType.PARAMETER_TYPE_ADDRESS:
              value = name;
              break;

            default:
              break;
          }

          this.system.commonDataBus.setBusy(type, name, null);
          this.system.commonDataBus.setResult(station, value);
        }

        station.instruction.writeBackTime = this.system.clock;
        station.state = ReservationStation.STATE_IDLE;
      }
    }

    // Check if all instructions are done
    let allDone = true;
    for (const station of this.system.reservationStations) {
      if (station.state === ReservationStation.STATE_ISSUE) {
        let needMoreValues = false;
        for (let j = 0; j < station.tags.length; j++) {
          if (station.tags[j] !== null) {
            const value = this.system.commonDataBus.getResult(station.tags[j]);
            if (value !== null) {
              station.parameters[j] = value;
              station.tags[j] = null;
            } else {
              needMoreValues = true;
            }
          }
        }
        if (!needMoreValues) {
          station.state = ReservationStation.STATE_EXECUTE;
        }
      }

      if (station.state !== ReservationStation.STATE_IDLE) {
        allDone = false;
      }
    }

    this.system.commonDataBus.clearResult();
    return allDone;
  }
}

export default Main;
