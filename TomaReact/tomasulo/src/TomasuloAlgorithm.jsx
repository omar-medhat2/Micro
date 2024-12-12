import React, { useState, useEffect } from 'react';
import './css/style.css';
import { initGUI, update, init } from './js/main.js';

const TomasuloAlgorithm = () => {
  const [program, setProgram] = useState('ld F6, 105\nld f2, 101\nmuld f0, f2, f4\nsubd f8, f6, f2\ndivd f10, f0, f6\naddd f6, f8, f2');
  const [main, setMain] = useState(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isDialog2Open, setDialog2Open] = useState(false);
  const [memAddr, setMemAddr] = useState(1);
  const [memVal, setMemVal] = useState(12);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    const mainInstance = init(program);
    setMain(mainInstance);
    initGUI(mainInstance, editMemory);
    update(mainInstance);
  }, [program]);

  useEffect(() => {
    if (main) {
      update(main);
    }
  }, [main]);

  const handleStep = () => {
    const done = main.step();
    update(main);
    if (done && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  const handleRun = () => {
    setIntervalId(setInterval(handleStep, 100));
  };

  const handleStop = () => {
    clearInterval(intervalId);
    setIntervalId(null);
    update(main);
  };

  const handleEnd = () => {
    main.run();
    update(main);
    clearInterval(intervalId);
    setIntervalId(null);
  };

  const handleRestart = () => {
    clearInterval(intervalId);
    const mainInstance = init(program);
    setMain(mainInstance);
    initGUI(mainInstance, editMemory);
    update(mainInstance);
  };

  const handleMultiStep = () => {
    const steps = parseInt(prompt("Please enter the number of running steps"), 10);
    for (let i = 0; i < steps; i++) {
      main.step();
    }
    update(main);
  };

  const handleInstEdit = () => {
    setDialogOpen(true);
  };

  const handleInstSubmit = () => {
    try {
      handleRestart();
      setDialogOpen(false);
    } catch (e) {
      alert("Program error, please check and try again");
    }
  };

  const handleMemSubmit = () => {
    main.system.memory.data[memAddr] = memVal;
    update(main);
    setDialog2Open(false);
  };

  const editMemory = (addr) => {
    setMemAddr(addr);
    setMemVal(main.system.memory.data[addr]);
    setDialog2Open(true);
  };

  return (
    <div>
      {isDialogOpen && (
        <div id="dialog" title="instruction-edit">
          <textarea id="inst-edit-input" value={program} onChange={(e) => setProgram(e.target.value)}></textarea>
          <button id="inst-submit" onClick={handleInstSubmit}>confirm</button>
        </div>
      )}
      {isDialog2Open && (
        <div id="dialog2" title="memory-edit">
          <input id="mem-addr" type="text" value={memAddr} disabled />
          <input id="mem-val" type="text" value={memVal} onChange={(e) => setMemVal(e.target.value)} />
          <button id="mem-submit" onClick={handleMemSubmit}>Revise</button>
        </div>
      )}

      <div className="page-wrap">
        <div className="left-wrap">
          <div className="pane-clock">
            <span id="global-clock" className="clock">0</span>
          </div>
          <div className="pane-registers">
            <div className="explain">Register File</div>
            <div className="registers">
              <div className="registers-type">
                <div className="type-name">Float Point Register</div>
                <ol className="registers-file list" id="float-registers"></ol>
              </div>
            </div>
          </div>
        </div>

        <div className="top-wrap">
          <div className="center-wrap">
            <div className="pane-control">
              <button id="action-step" onClick={handleStep}>Step</button>
              <button id="action-restart" onClick={handleRestart}>Restart</button>
              <button id="action-end" onClick={handleEnd}>End</button>
              <button id="action-run" onClick={handleRun}>Run</button>
              <button id="action-stop" onClick={handleStop}>Stop</button>
              <button id="action-multistep" onClick={handleMultiStep}>Multi Step</button>
            </div>

            <div className="pane-reservation">
              <div className="explain">Reserved Station</div>
              <ol id="reservation-stations" className="list">
                <li className="station title">
                  <span className="name">Name</span>
                  <span className="time-remaining">Time Left</span>
                  <span className="instruction-number">Command Line Number</span>
                  <span className="state">State</span>
                  <span className="p1">Output</span>
                  <span className="p2">Enter 1</span>
                  <span className="p3">Enter 2</span>
                </li>
              </ol>
            </div>
          </div>

          <div className="right-wrap">
            <div className="pane-instruction">
              <div className="explain">
                Command Queue <span id="total-inst"></span>
                <span className="right">
                  <a href="#" id="action-inst-edit" onClick={handleInstEdit}><i className="icon-edit"></i>Edit</a>
                </span>
              </div>
              <ol id="instruction-show" className="list">
                <li className="instruction title">
                  <span className="inst-linenum">Line Number</span>
                  <span className="instruction-detail">Instruction</span>
                  <span className="issue-time">Reading Time</span>
                  <span className="exec-time">Completion time</span>
                  <span className="writeback-time">Write Back time</span>
                </li>
                {/* More list items will go here */}
              </ol>
            </div>
          </div>
        </div>

        <div className="bottom-wrap">
          <div className="explain">Memory</div>
          <div className="pane-memory">
            <div id="memory-show">
              {/* Memory blocks will be inserted here dynamically */}
            </div>
          </div>
        </div>
      </div>

      <div id="cur-pc">Program Counter: 0</div>
    </div>
  );
};

export default TomasuloAlgorithm;