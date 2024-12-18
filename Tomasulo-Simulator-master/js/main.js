

function Buffer(_, memory) {
	ReservationStation.apply(this, arguments);
	this.memory = memory;
	return this;
}

Buffer.prototype = new ReservationStation();



function CommonDataBus() {
	this._busy = {};
	this._result = {};
}

CommonDataBus.prototype.getBusy = function (type, name) {
	var result = this._busy[type + '.' + name];
	if (typeof result === 'undefined') {
		return null;
	} else {
		return result;
	}
};

CommonDataBus.prototype.setBusy = function (type, name, instruction) {
	this._busy[type + '.' + name] = instruction;
};

CommonDataBus.prototype.getResult = function (station) {
	var result = this._result['' + station.instruction.id];
	if (typeof result === 'undefined') {
		return null;
	} else {
		return result;
	}
};

CommonDataBus.prototype.setResult = function (station, value) {
	this._result['' + station.instruction.id] = value;
};

CommonDataBus.prototype.clearResult = function () {
	this._result = {};
};








function RegisterFile(count, prefix) {
	this.registers = new Array(count);
	for (var i = 0; i < this.registers.length; ++i) {
		this.registers[i] = 1;
	}
	this.count = count;
	this.prefix = prefix.toUpperCase();
}

RegisterFile.prototype._getIndex = function (name) {
	name = name.toUpperCase();
	if (name.substring(0, this.prefix.length) === this.prefix) {
		var index = parseInt(name.substring(this.prefix.length), 10);
		if (index >= 0 && index < this.count) {
			return index;
		}
	}
	throw new Error('[REGISTER_FILE] Invalid register "' + name + '"');
};

RegisterFile.prototype.get = function (name) {
	return this.registers[this._getIndex(name)];
};

RegisterFile.prototype.set = function (name, value) {
	this.registers[this._getIndex(name)] = value;
};




function Memory(size) {
	this.data = new Array(size);
	this.size = size;
	for (var i = 0; i < this.data.length; ++i) {
		this.data[i] = i;
	}
}

Memory.prototype._check_addr = function (addr) {
	if (addr >= this.size || addr < 0) {
		throw new Error('[MEMORY] Invalid address "' + addr + '"');
	}
};

Memory.prototype.load = function (addr) {
	this._check_addr(addr);
	return this.data[addr];
};

Memory.prototype.store = function (addr, value) {
	this._check_addr(addr);
	this.data[addr] = value;
};



var id = 0;

function Instruction(type, parameters) {
	this.id = ++id;
	this.type = type;
	this.time = type.cycles;
	this.parameters = parameters;
	this.issueTime = -1;
	this.executeTime = -1;
	this.writeBackTime = -1;
}
Instruction.resetID = function () {
	id = 0;
}




function InstructionType(name, cycles, destParameter, parameters, calculate, stations) {
	this.name = name;
	this.cycles = cycles;
	this.parameters = parameters;
	this.destParameter = destParameter;
	this.calculate = calculate;
	this.stations = stations;
}

InstructionType.PARAMETER_TYPE_REGISTER = 0;
InstructionType.PARAMETER_TYPE_ADDRESS = 1;

if (typeof module !== 'object') {
	this.InstructionType = InstructionType;
}


function ReservationStation(name) {
	this.name = name;
	this.state = ReservationStation.STATE_IDLE;
	this.parameters = null;
	this.tags = null;
	this.instruction = null;
}

ReservationStation.STATE_IDLE = 1;
ReservationStation.STATE_ISSUE = 2;
ReservationStation.STATE_EXECUTE = 3;
ReservationStation.STATE_WRITE_BACK = 4;



function Main(program, system) {
	Instruction.resetID();
	this.system = system;
	this.system.clock = 0;

	program = program.toUpperCase()
		.replace(/[\s,]+/g, ',')
		.replace(/^,|,$/g, '');

	var tokens = program.split(',');
	var instructions = [];
	// *200*9#
	for (var i = 0; i < tokens.length;) {
		var instructionType = this.system.instructionTypes[tokens[i++]];
		var params = [];
		for (var j = 0; j < instructionType.parameters.length; ++j, ++i) {
			switch (instructionType.parameters[j]) {
				case InstructionType.PARAMETER_TYPE_REGISTER:
					params.push(tokens[i]);
					break;
				case InstructionType.PARAMETER_TYPE_ADDRESS:
					params.push(parseInt(tokens[i], 10));
					break;
			}
		}
		instructions.push(new Instruction(instructionType, params));
	}

	this.instructions = instructions;
	this.issuedInstructions = 0;
}


Main.prototype.step = function () {
	++this.system.clock;


	if (this.instructions.length > this.issuedInstructions) {
		var instruction = this.instructions[this.issuedInstructions];
		var stations = instruction.type.stations;
		for (var i = 0; i < stations.length; ++i) {
			if (stations[i].state == ReservationStation.STATE_IDLE) {
				var station = stations[i];

				station.state = ReservationStation.STATE_ISSUE;
				station.instruction = instruction;
				instruction.issueTime = this.system.clock;

				var dest = instruction.type.destParameter;
				var paramCount = instruction.type.parameters.length;

				station.parameters = [];
				station.tags = [];
				for (var i = 0; i < paramCount; ++i) {
					var value = null;
					var tag = null;

					if (i !== dest) {
						switch (instruction.type.parameters[i]) {
							case InstructionType.PARAMETER_TYPE_REGISTER:
								tag = this.system.commonDataBus.getBusy(InstructionType.PARAMETER_TYPE_REGISTER, instruction.parameters[i]);
								if (tag === null) {
									value = this.system.registerFile.get(instruction.parameters[i]);
								}
								break;
							case InstructionType.PARAMETER_TYPE_ADDRESS:
								tag = this.system.commonDataBus.getBusy(InstructionType.PARAMETER_TYPE_ADDRESS, instruction.parameters[i]);
								value = instruction.parameters[i];
								break;
						}
					} else { // dest
						value = instruction.parameters[i];
					}

					station.parameters.push(value);
					station.tags.push(tag);
				}

				var type = instruction.type.parameters[dest];
				var name = instruction.parameters[dest];
				this.system.commonDataBus.setBusy(type, name, station);

				++this.issuedInstructions;
			}
		}
	}


	for (var i in this.system.reservationStations) {
		var station = this.system.reservationStations[i];
		if (station.state === ReservationStation.STATE_EXECUTE) {

			if ((--station.instruction.time) === 0) {
				station.instruction.executeTime = this.system.clock;
				station.state = ReservationStation.STATE_WRITE_BACK;
			}

		} else if (station.state === ReservationStation.STATE_WRITE_BACK) {

			var dest = station.instruction.type.destParameter;
			var type = station.instruction.type.parameters[dest];
			var name = station.instruction.parameters[dest];
			var value = station.instruction.type.calculate.call(station, station.parameters);
			if (typeof value === 'undefined') {
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
				}

				this.system.commonDataBus.setBusy(type, name, null);
				this.system.commonDataBus.setResult(station, value);
			}

			station.instruction.writeBackTime = this.system.clock;
			station.state = ReservationStation.STATE_IDLE;

		}
	}

	var allDone = true;
	for (var i in this.system.reservationStations) {
		var station = this.system.reservationStations[i];
		if (station.state === ReservationStation.STATE_ISSUE) {

			var needMoreValues = false;
			for (var j = 0; j < station.tags.length; ++j) {
				if (station.tags[j] !== null) {
					var value = this.system.commonDataBus.getResult(station.tags[j]);
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

Main.prototype.run = function () {
	while (!this.step()) {
		// ...
	}
}

function init(program) {
	'use strict';
	var System = {};
	System.memory = new Memory(4096);
	System.registerFile = new RegisterFile(11, 'F');
	System.commonDataBus = new CommonDataBus();
	System.reservationStations = {
		ADD_1: new ReservationStation('ADD_1'),
		ADD_2: new ReservationStation('ADD_2'),

		MUL_1: new ReservationStation('MUL_1'),
		MUL_2: new ReservationStation('MUL_2'),

		LOAD_1: new Buffer('LOAD_1', System.memory),
		LOAD_2: new Buffer('LOAD_2', System.memory),

		STORE_1: new Buffer('STORE_1', System.memory),
		STORE_2: new Buffer('STORE_2', System.memory)

	};
	System.instructionTypes = {
		'ADDD': new InstructionType('ADDD', 2, 0,
			[InstructionType.PARAMETER_TYPE_REGISTER,
			InstructionType.PARAMETER_TYPE_REGISTER,
			InstructionType.PARAMETER_TYPE_REGISTER],
			function (p) { return p[1] + p[2]; },
			[System.reservationStations['ADD_1'],
			System.reservationStations['ADD_2'],
			]),

		'SUBD': new InstructionType('SUBD', 2, 0,
			[InstructionType.PARAMETER_TYPE_REGISTER,
			InstructionType.PARAMETER_TYPE_REGISTER,
			InstructionType.PARAMETER_TYPE_REGISTER],
			function (p) { return p[1] - p[2]; },
			[System.reservationStations['ADD_1'],
			System.reservationStations['ADD_2'],
			]),

		'MULD': new InstructionType('MULD', 10, 0,
			[InstructionType.PARAMETER_TYPE_REGISTER,
			InstructionType.PARAMETER_TYPE_REGISTER,
			InstructionType.PARAMETER_TYPE_REGISTER],
			function (p) { return p[1] * p[2]; },
			[System.reservationStations['MUL_1'],
			System.reservationStations['MUL_2']
			]),

		'DIVD': new InstructionType('DIVD', 2, 0,
			[InstructionType.PARAMETER_TYPE_REGISTER,
			InstructionType.PARAMETER_TYPE_REGISTER,
			InstructionType.PARAMETER_TYPE_REGISTER],
			function (p) { return p[1] / p[2]; },
			[System.reservationStations['MUL_1'],
			System.reservationStations['MUL_2']]),

		'LD': new InstructionType('LD', 3, 0,
			[InstructionType.PARAMETER_TYPE_REGISTER,
			InstructionType.PARAMETER_TYPE_ADDRESS],
			function (p) { return this.memory.load(p[1]); },
			[System.reservationStations['LOAD_1'],
			System.reservationStations['LOAD_2'],
			]),

		'ST': new InstructionType('ST', 2, 1,
			[InstructionType.PARAMETER_TYPE_REGISTER,
			InstructionType.PARAMETER_TYPE_ADDRESS],
			function (p) { this.memory.store(p[1], p[0]); return p[0]; },
			[System.reservationStations['STORE_1'],
			System.reservationStations['STORE_2'],
			])
	};

	return new Main(program, System);
};


function update(main) {
	document.getElementById('global-clock').innerText = main.system.clock;
	for (var i = 0; i < 11; ++i) {
		var busy = main.system.commonDataBus.getBusy(InstructionType.PARAMETER_TYPE_REGISTER, 'F' + i);
		var value = main.system.registerFile.get('F' + i);
		document.getElementById('reg-F' + i).innerText = value.toFixed(5);
	}
	$('#total-inst').text(main.instructions.length);
	for (var i = 0; i < main.instructions.length; ++i) {
		var ii = main.instructions[i];
		var inst = document.getElementById('inst-' + ii.id);
		inst.querySelector('.issue-time').innerText = ii.issueTime > 0 ? ii.issueTime : '';
		inst.querySelector('.exec-time').innerText = ii.executeTime > 0 ? ii.executeTime : '';
		inst.querySelector('.writeback-time').innerText = ii.writeBackTime > 0 ? ii.writeBackTime : '';
	}
	for (var name in main.system.reservationStations) {
		var station = main.system.reservationStations[name]
		var guiItem = document.getElementById('station-' + name);
		var _state;
		switch (station.state) {
			case ReservationStation.STATE_IDLE:
				_state = 'IDLE';
				break;
			case ReservationStation.STATE_ISSUE:
				_state = 'ISSUE';
				break;
			case ReservationStation.STATE_EXECUTE:
				_state = 'EXEC';
				break;
			case ReservationStation.STATE_WRITE_BACK:
				_state = 'WRITE';
		}
		var _remain_time = -1;
		guiItem.querySelector('.state').innerText = _state;
		if (station.state !== ReservationStation.STATE_IDLE) {
			if (station.instruction) {
				_remain_time = station.instruction.time;
			}
			var _curInst = '[' + station.instruction.id + ']';
			guiItem.querySelector('.instruction-number').innerText = _curInst;
			for (var i = 0; i < 3; i++) {
				var td = guiItem.querySelector('.p' + (i + 1));
				if (i >= station.parameters.length) {
					td.innerHTML = ' - ';
				}
				else {
					if (station.tags[i]) {
						td.innerHTML = station.tags[i].name;
					}
					else {
						td.innerHTML = station.parameters[i];
					}
				}
			}
		}
		else {
			guiItem.querySelector('.instruction-number').innerText = '';
			for (var i = 0; i < 3; i++) {
				var td = guiItem.querySelector('.p' + (i + 1));
				td.innerHTML = '';
			}
		}
		guiItem.querySelector('.time-remaining').innerText = _remain_time >= 0 ? _remain_time : '';
	}
	$('#cur-pc').text(main.issuedInstructions);
	for (var i = 0; i < main.system.memory.size; i++) {
		document.getElementById('m' + i).children[1].innerText = main.system.memory.data[i];
	}
}



var interval;
function initGUI(main) {
	$('.station:not(.title)').remove();
	$('.instruction:not(.title)').remove();
	$('.register:not(.title)').remove();
	var CONSTVAR = {
		'newreg': function (name) {
			return '<li class="register"> <span class="name">' + name + '</span> <span class="value" id="reg-' + name + '"> </span> </li>';
		},
		'newstation': function (name) {
			return '<li class="station" id="station-' + name + '"> <span class="name">' + name + '</span> <span class="time-remaining"></span>  <span class="instruction-number"> </span> <span class="state"> </span> <span class="p1">  </span> <span class="p2"> </span> <span class="p3"></span> </li>';
		},
		'newinst': function (linenum, detail) {
			return '<li class="instruction" id="inst-' + linenum + '"> <span class="inst-linenum">' + linenum + '</span><span class="instruction-detail">' + detail + '</span> <span class="issue-time"></span> <span class="exec-time"></span> <span class="writeback-time"></span> </li>';
		},
		'newmem': function (addr, value) {
			return '<div id="m' + addr + '" class="memory"><span class="addr">' + addr + '</span><span class="value">' + value + '</span></div>';
		}
	};
	var _html = '';
	for (var i = 0; i < main.system.registerFile.count; i++) {
		_html += CONSTVAR.newreg(main.system.registerFile.prefix + i);
	}
	$('#float-registers').get(0).innerHTML += ((_html));
	var _html = '';
	for (rs in main.system.reservationStations) {
		_html += CONSTVAR.newstation(rs);
	}
	$('#reservation-stations').get(0).innerHTML += ((_html));

	var _html = '';
	for (var i = 0; i < main.instructions.length; i++) {
		var ii = main.instructions[i];
		_html += CONSTVAR.newinst(ii.id, ii.type.name + ' ' + ii.parameters.join(', '));
	}
	$('#instruction-show').get(0).innerHTML += ((_html));
	var _html = '';
	for (var i = 0; i < main.system.memory.size; i++) {
		_html += CONSTVAR.newmem(i, main.system.memory.data[i]);
	}
	document.getElementById('memory-show').innerHTML = _html;
	$('#memory-show').on('click', '.memory', function () {
		editMemory(this.id.substring(1));
	});
}




$(function () {
	var program = 'ld F6, 105\n' +
		'ld f2, 101\n' +
		'muld f0, f2, f4\n' +
		'subd f8, f6, f2\n' +
		'divd f10, f0, f6\n' +
		'addd f6, f8, f2';
	var main = init(program);
	initGUI(main);
	update(main);
	$('#dialog').dialog({
		autoOpen: false,
		resizable: false,
		height: 500,
		width: 600,
		modal: true,
	});
	$('#dialog2').dialog({
		autoOpen: false,
		resizable: false,
		height: 100,
		width: 600,
		modal: true,
	});
	$('#action-step').button().on('click', function () {
		var done = main.step();
		update(main);
		if (done && interval) {
			clearInterval(interval);
			$('#action-run').attr('disabled', null);
		}
	});
	$('#action-run').button().on('click', function () {
		$('#action-run').attr('disabled', 'disabled');
		interval = setInterval(function () { $('#action-step').click(); }, 100);
	});
	$('#action-stop').button().on('click', function () {
		clearInterval(interval);
		$('#action-run').attr('disabled', null);
		update(main);
	});
	$('#action-end').button().on('click', function () {
		main.run();
		update(main);
		$('#action-run').attr('disabled', null);
		if (interval) {
			clearInterval(interval);
		}
	});
	$('#action-restart').button().on('click', function () {
		if (interval) {
			clearInterval(interval);
		}
		main = init(program);
		initGUI(main);
		update(main);
	});
	$('#action-multistep').button().on('click', function () {
		var n = prompt("Please enter the number of running steps");
		$('#action-multistep').attr('disabled', 'disabled');
		for (var i = 0; i < n; i += 1) {
			main.step();
		}
		update(main);
		$('#action-multistep').attr('disabled', null);
	});
	$('#action-inst-edit').on('click', function () {
		$('#inst-edit-input').val(program);
		$('#dialog').dialog('open');
	});
	$('#inst-submit').button().click(function () {
		program = $('#inst-edit-input').val();
		try {
			$('#action-restart').click();
			$('#dialog').dialog('close');
		}
		catch (e) {
			alert("Program error, please check and try again");
		}
	});

	var bwExpand = true;
	$('.bottom-wrap .explain').on('click', function () {
		if (bwExpand) {
			bwExpand = false;
			$('.bottom-wrap').animate({
				height: 26
			}, 500);
			$('.top-wrap').animate({
				bottom: 26
			}, 500);
		} else {
			bwExpand = true;
			$('.bottom-wrap').animate({
				height: 300
			}, 500);
			$('.top-wrap').animate({
				bottom: 300
			}, 500);

		}
	});
	window.editMemory = function (addr) {
		$('#dialog2').dialog('open');
		$('#mem-addr').val(addr);
		$('#mem-val').val(main.system.memory.data[addr]);
	}
	$('#mem-submit').on('click', function () {
		var addr = $('#mem-addr').val();
		var val = $('#mem-val').val();
		main.system.memory.data[addr] = val;
		$('#m' + addr + ' .value').text(val);
		$('#dialog2').dialog('close');
	});
});