// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cs from 'cross-spawn';

export var extensionContext: vscode.ExtensionContext;
export var screen: vscode.WebviewPanel;

function start() {
	screen = vscode.window.createWebviewPanel(
		'knel_screen',
		'KnEL',
		vscode.ViewColumn.Beside,
		{}
	);

	screen.webview.html = getWebviewContent("Compile your program");
}

function compile() {
	if (!vscode.window.activeTextEditor) {
		console.log('Cannot start to build because the active editor is undefined.')
		return
	}
	if (!screen) {
		start()
	}
	console.log('Fetching context!');
	console.log('Got context, looking for info!');

	const command = process.env.KNELC as string;
	const args = [`--html-view`, `${vscode.window.activeTextEditor.document.uri.fsPath}`];
	console.log(`Tries to spawn compiler! ${command} ${args}`);
	var currentProcess =
		cs.spawn(command, args);
	const pid = currentProcess.pid;
	console.log(`Spawned compiler ${pid}!`);
	let stdout = ''
	currentProcess.stdout.on('data', (newStdout: Buffer | string) => {
		console.log(`log : ${newStdout}`);
		stdout += newStdout;
	})
	let stderr = ''
	currentProcess.stderr.on('data', (newStderr: Buffer | string) => {
		stderr += newStderr;
	})

	currentProcess.on('error', err => {
		console.log(`Build fatal error: ${err.message}, ${stderr}. PID: ${pid}. Does the executable exist?`)
	})

	currentProcess.on('exit', (exitCode, signal) => {
		if (exitCode !== 0) {
			screen.webview.html = getWebviewContent(stderr);
			console.log(`Build returns with error: ${exitCode}/${signal}. PID: ${pid}.`)
		} else {
			screen.webview.html = getWebviewContent(stdout);
			console.log(`Successfully built. PID: ${pid}`)
		}
	})
}

function getWebviewContent(text: string) {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>KnEL Screen</title>
  </head>
  <body>
	  ${text}
  </body>
  </html>`;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	extensionContext = context;
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "knel-ext" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.knel.compile', compile);

	context.subscriptions.push(disposable);

	context.subscriptions.push(vscode.commands.registerCommand('extension.knel.start', start));
}

// this method is called when your extension is deactivated
export function deactivate() {}
