type ReturnType = 'line' | 'index';

type PickedColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'bright_black'
  | 'bright_red'
  | 'bright_green'
  | 'bright_yellow'
  | 'bright_blue'
  | 'bright_magenta'
  | 'bright_cyan'
  | 'bright_white';

type Choices = (string | number)[];

const colors = {
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bright_black: '\x1b[90m',
  bright_red: '\x1b[91m',
  bright_green: '\x1b[92m',
  bright_yellow: '\x1b[93m',
  bright_blue: '\x1b[94m',
  bright_magenta: '\x1b[95m',
  bright_cyan: '\x1b[96m',
  bright_white: '\x1b[97m'
};

const getDownBorder = (choices: Choices, upBorder: number) => {
  return process.stdout.rows > choices.length ? choices.length : process.stdout.rows + upBorder;
};

const redraw = (choices: Choices, line: number, upBorder: number, downBorder: number, pickedColor?: PickedColor) => {
  console.clear();

  for (let i = 0, m = upBorder; i < getDownBorder(choices, 0), m < downBorder; i++, m++) {
    const choice = choices[m].toString();

    process.stdout.cursorTo(0, i);
    process.stdout.clearLine(0);
    process.stdout.write(m === line ? colors[pickedColor || 'cyan'] + choice + '\x1b[0m' : choice);
  }
};

export const ask = (choices: (string | number)[], returnType: ReturnType, pickedColor?: PickedColor) => {
  return new Promise((resolve) => {
    let currentPos = 0;
    let upBorder = 0;
    let downBorder = getDownBorder(choices, 0);

    const resizeHandler = () => {
      const potentialUpBorder = currentPos - getDownBorder(choices, 0) + 1;
      upBorder = potentialUpBorder > 0 ? potentialUpBorder : 0;
      downBorder = getDownBorder(choices, upBorder);
      redraw(choices, currentPos, upBorder, downBorder, pickedColor);
    };

    const exitHandler = () => {
      console.clear();
      process.exit(0);
    };

    const keyPressHandler = (key: string) => {
      key = key.toLowerCase();
      if ((key === '\u001b[a' || key === 'w') && currentPos > 0) currentPos--;
      if ((key === '\u001b[b' || key === 's') && currentPos < choices.length - 1) currentPos++;

      if (key === ' ' || key === '\r') {
        process.stdin.removeListener('data', keyPressHandler);
        process.removeListener('SIGWINCH', resizeHandler);
        process.removeListener('SIGINT', exitHandler);
        process.stdin.pause().setRawMode(false);
        resolve(returnType === 'index' ? currentPos : choices[currentPos]);
      }

      if (currentPos >= downBorder) {
        upBorder++;
        downBorder++;
      }

      if (currentPos < upBorder) {
        upBorder--;
        downBorder--;
      }

      redraw(choices, currentPos, upBorder, downBorder, pickedColor);
    };

    redraw(choices, currentPos, upBorder, downBorder, pickedColor);

    process.on('SIGWINCH', resizeHandler);
    process.on('SIGINT', exitHandler);
    process.stdin.setRawMode(true).setEncoding('utf8').resume().on('data', keyPressHandler);
  });
};
