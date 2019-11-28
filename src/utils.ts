import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { ExecSyncOptionsWithStringEncoding, SpawnOptions } from 'child_process';

import * as shelljs from 'shelljs';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export function resolveHome(filepath: string): string {
    if (filepath[0] === '~') {
        if (!process.env.HOME) {
            throw new Error('"HOME" environment variable is required')
        }
        return path.join(process.env.HOME, filepath.slice(1));
    }
    return filepath;
}

export function removeFile(filepath: string) {
  shelljs.rm(filepath);
}

export function newFile(fileName: string): void {
  fs.writeFileSync(fileName, '', { encoding: 'utf8' });
}

export function loadJson(filePath: string): any {
    filePath = resolveHome(filePath);
    const content = fs.readFileSync(filePath, {encoding: 'utf8'});
    return JSON.parse(content);
}

export function renameFile(dir: string, oldName: string, newName: string): void {
    dir = resolveHome(dir);
    const oldPath = path.join(dir, oldName);
    const newPath = path.join(dir, newName);
    console.log(`'${oldPath}' --> '${newPath}'`);
    shelljs.mv(oldPath, newPath);
}

export function renameFileByReplace(dir: string, target: string, replaceWith: string): void {
    dir = resolveHome(dir);
    const fileNames = ls(dir);
    fileNames
        .filter(name => name.includes(target))
        .forEach(name => {
            const newName = name.replace(target, replaceWith);

            renameFile(dir, name, newName);
        });
}

export function ls(argStr: string = ''): string[] {
  return simpleExec(`ls -a ${argStr}`).split('\n').filter(x => x);
}


export function simpleExec(
    cmd: string, env = null,
    options: Omit<ExecSyncOptionsWithStringEncoding, 'encoding'> = {}
): string {
    return child_process.execSync(cmd, { encoding: 'utf-8', env, ...options } as any);
}

export function execP(cmd: string, options: SpawnOptions = {}) {
  const finalOptions = {
    shell: '/bin/bash',
    ...options
  };
  const child = child_process.spawn(cmd, [], finalOptions);

  let stdout = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', data => {
    stdout = stdout + data.toString();
    console.log(data.toLocaleString());
  });

  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', data => {
    stderr = stderr + data.toString();
    console.log(data.toLocaleString());
  });

  return new Promise((resolve, reject) => {
    child.on('close', code => {
      const result = {
        stdout,
        stderr,
        code
      };

      if (code === 0) {
        resolve(result);
      } else {
        reject(result);
      }
    });
  });
}