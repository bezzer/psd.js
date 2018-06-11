import path from 'path';
import fs from 'fs-extra';
import { exec } from 'child_process';

const defaultOptions = {
  output: process.cwd(),
  scale: 1,
  rename: undefined,
};

const optionsKey = {
  output: 'o',
  size: 's',
  scale: 'f',
};

module.exports = (input, options) => {
  return new Promise((resolve, reject) => {
    const opts = Object.assign(defaultOptions, options);
    const args = Object.keys(optionsKey).reduce((a, o) => `${a} -${optionsKey[o]} ${opts[o]}`, '');
    const command = `qlmanage -t ${input} ${args}`;

    exec(command, (err, stdout) => {
      var message, outputPath;
      if (err) {
        return reject(err);
      }

      if ((message = (stdout.match(/^\[ERROR\].*$/m) || [])[0])) {
        return reject(new Error(message));
      }

      resolve();
    });
  });
};
