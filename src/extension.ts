// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as path from 'path';
import * as fs from 'fs';

import * as vscode from 'vscode';
import { QuickPick } from 'vscode';
import * as lodash from 'lodash';
import * as utils from './utils';

function getDirectoryFromFullName(filePath: string): string {
    const fileNameParts = filePath.split('/');
    fileNameParts.pop();
    return fileNameParts.join('/');
}

function getItems(dir: string) {
  const result = utils
    .ls(dir)
    .filter(x => x !== '.')
    .map(file => ({ label: file }));

  return result;
}

function openDir(dir: string) {
    vscode.commands.executeCommand('extension.dired.open', dir)
}

function openFile(filePath: string) {
  const resource = vscode.Uri.parse(filePath);
  vscode.commands.executeCommand('vscode.open', resource);
}

function createFileOrDir(filePath: string) {
}



function findFile(dir: string) {
  const quickPick = vscode.window.createQuickPick();
  quickPick.title = `Find file at ${dir} `;
  quickPick.items = getItems(dir)
  quickPick.onDidAccept(() => {
    quickPick.hide();
    const selectedItem = quickPick.selectedItems[0];
    if (selectedItem) {
      const targetPath = path.join(dir, selectedItem.label);
      if (fs.lstatSync(targetPath).isDirectory()) {
        findFile(targetPath);
      } else {
        openFile(targetPath);
      }
    } else {
      const fileName = quickPick.value.trim();
      const targetPath = path.join(dir, fileName);
      utils.newFile(targetPath);
      openFile(targetPath);
    }
  });

  quickPick.show();
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "mistkafka-extension" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('extension.myFindFile', () => {
    const filename = lodash.get(vscode.window.activeTextEditor, 'document.fileName', null);
    if (!filename) {
      vscode.window.showInformationMessage('You are not in a dir');
      return;
    }
    const currentDir = getDirectoryFromFullName(filename);

    findFile(currentDir);
  });
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand('extension.newFile', () => {
    const input = vscode.window.createInputBox();
    input.title = "File Name: ";
    input.onDidAccept(() => {
      const fileName = input.value;
      let currentDir: string = '/';
      const filename = lodash.get(vscode.window.activeTextEditor, 'document.fileName', null);
      if (filename) {
        currentDir = getDirectoryFromFullName(filename);
      }
      const filePath = path.join(currentDir, fileName);
      utils.newFile(filePath);
      input.hide();
      openFile(filePath);
    });
    input.show();
  });
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand('extension.closeOtherGroupsAndHideSidebarVisibility', () => {
    vscode.commands.executeCommand('workbench.action.closeEditorsInOtherGroups');
    vscode.commands.executeCommand('workbench.action.maximizeEditor');
    vscode.commands.executeCommand('workbench.action.closePanel');
  });
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand('extension.myDeleteCurrentFile', async () => {
    const filename = lodash.get(vscode.window.activeTextEditor, 'document.fileName', null);
    utils.removeFile(filename);
    vscode.workspace
  });
  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
