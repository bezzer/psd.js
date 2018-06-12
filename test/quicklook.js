import path from 'path';
import fs from 'fs-extra';
import { exec } from 'child_process';

const defaultOptions = {
  output: process.cwd(),
  rename: undefined,
};

const optionsKey = {
  output: 'o',
  size: 's',
};

module.exports = (input, options) => {
  return new Promise(async (resolve, reject) => {
    const opts = Object.assign(defaultOptions, options);
    const args = Object.keys(optionsKey).reduce((a, o) => `${a} -${optionsKey[o]} ${opts[o]}`, '');
    const command = `qlmanage -t ${args} ${input}`;

    await fs.ensureDir(opts.output);

    exec(command, async (err, stdout) => {
      if (err) {
        return reject(err);
      }

      let message;
      if ((message = (stdout.match(/^\[ERROR\].*$/m) || [])[0])) {
        return reject(new Error(message));
      }

      if (opts.rename) {
        const outputFile = path.join(opts.output, `${path.basename(input)}.png`);
        const newOutputFile = path.join(opts.output, opts.rename);
        await fs.move(outputFile, newOutputFile, { overwrite: true });
      }

      resolve();
    });
  });
};
