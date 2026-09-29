import { useState } from "react";
import { FiDelete } from "react-icons/fi";

export default function StandardCalculator() {
  const [display, setDisplay] = useState("0");

  const handleNumClick = (val) => {
    if (display === "0" || display === "Error") {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const handleOpClick = (op) => {
    if (display === "Error") return;
    // Prevent multiple operators in a row
    const lastChar = display.slice(-1);
    if (["+", "-", "*", "/"].includes(lastChar)) {
      setDisplay(display.slice(0, -1) + op);
    } else {
      setDisplay(display + op);
    }
  };

  const calculate = () => {
    try {
      // Safely evaluate the math string
      const result = new Function("return " + display)();
      // Round to 2 decimal places if necessary, else keep as is
      setDisplay(String(Math.round(result * 100) / 100));
    } catch (error) {
      setDisplay("Error");
    }
  };

  const clear = () => {
    setDisplay("0");
  };

  const deleteLast = () => {
    if (display === "Error" || display.length === 1) {
      setDisplay("0");
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  // Button generic styles
  const btnStyle = "p-4 rounded-2xl font-bold text-sm transition flex items-center justify-center";
  const numStyle = `${btnStyle} bg-zinc-100 hover:bg-zinc-200 text-black`;
  const opStyle = `${btnStyle} bg-zinc-800 hover:bg-zinc-900 text-white`;

  return (
    <div className="w-full max-w-xs p-5 bg-white border border-zinc-200 rounded-3xl shadow-sm">
      {/* Display Screen */}
      <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl mb-4 text-right overflow-x-auto">
        <span className="text-2xl font-black text-black tracking-wider">
          {display}
        </span>
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1 */}
        <button onClick={clear} className={`${btnStyle} bg-red-100 hover:bg-red-200 text-red-600 col-span-2`}>
          CLEAR
        </button>
        <button onClick={deleteLast} className={`${btnStyle} bg-zinc-200 hover:bg-zinc-300 text-zinc-700`}>
          <FiDelete size={18} />
        </button>
        <button onClick={() => handleOpClick("/")} className={opStyle}>/</button>

        {/* Row 2 */}
        <button onClick={() => handleNumClick("7")} className={numStyle}>7</button>
        <button onClick={() => handleNumClick("8")} className={numStyle}>8</button>
        <button onClick={() => handleNumClick("9")} className={numStyle}>9</button>
        <button onClick={() => handleOpClick("*")} className={opStyle}>*</button>

        {/* Row 3 */}
        <button onClick={() => handleNumClick("4")} className={numStyle}>4</button>
        <button onClick={() => handleNumClick("5")} className={numStyle}>5</button>
        <button onClick={() => handleNumClick("6")} className={numStyle}>6</button>
        <button onClick={() => handleOpClick("-")} className={opStyle}>-</button>

        {/* Row 4 */}
        <button onClick={() => handleNumClick("1")} className={numStyle}>1</button>
        <button onClick={() => handleNumClick("2")} className={numStyle}>2</button>
        <button onClick={() => handleNumClick("3")} className={numStyle}>3</button>
        <button onClick={() => handleOpClick("+")} className={opStyle}>+</button>

        {/* Row 5 */}
        <button onClick={() => handleNumClick("0")} className={`${numStyle} col-span-2`}>0</button>
        <button onClick={() => handleNumClick(".")} className={numStyle}>.</button>
        <button onClick={calculate} className={`${btnStyle} bg-orange-500 hover:bg-orange-600 text-white shadow-sm`}>=</button>
      </div>
    </div>
  );
}