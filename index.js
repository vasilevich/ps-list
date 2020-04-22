'use strict';
const path = require('path');
const childProcess = require('child_process');
const mypid = require('process').pid;
const pify = require('pify');
const os = require('os');

function win(options = {}) {
	const processArgs = options.processName ? `process, where, name like "%${options.processName}%"` : 'process';
	return pify(childProcess.execFile)('wmic', processArgs.split(',').map(s => s.trim()).concat(['get', '*', '/format:csv'])).then(stdout => {
		stdout = stdout.trim().split(os.EOL);
		let header = stdout.shift().split(',').map(l => l.toLowerCase());
		stdout = stdout.map(l => l.split(',').map((value, index) => ({ [`${header[index]}`]: value })).reduce((a, c) => Object.assign(a, c))).map(l => {
			return Object.assign(l, {
				pid: Number.parseInt(l.processid, 10),
				cmd: l.commandline,
				ppid: Number.parseInt(l.parentprocessid, 10)
			});
		});
		return stdout;
	});
}

function def(options = {}) {
	const ret = {};
	const flags = (options.all === false ? '' : 'a') + 'wwxo';
	const {includeSelf} = options;

	return Promise.all(['comm', 'args', 'ppid', '%cpu', '%mem'].map(cmd => {
		return pify(childProcess.execFile)('ps', [flags, `pid,${cmd}`]).then(stdout => {
			for (let line of stdout.trim().split('\n').slice(1)) {
				line = line.trim();
				const [pid] = line.split(' ', 1);
				const val = line.slice(pid.length + 1).trim();

				if (ret[pid] === undefined) {
					ret[pid] = {};
				}

				ret[pid][cmd] = val;
			}
		});
	})).then(() => {
		// Filter out inconsistencies as there might be race
		// issues due to differences in `ps` between the spawns
		// TODO: Use `Object.entries` when targeting Node.js 8
		if (includeSelf) {
			return Object.keys(ret).filter(x => ret[x].comm && ret[x].args && ret[x].ppid && ret[x]['%cpu'] && ret[x]['%mem']).map(x => {
				return {
					pid: Number.parseInt(x, 10),
					name: path.basename(ret[x].comm),
					cmd: ret[x].args,
					ppid: Number.parseInt(ret[x].ppid, 10),
					cpu: Number.parseFloat(ret[x]['%cpu']),
					memory: Number.parseFloat(ret[x]['%mem'])
				};
			});
		}
		return Object.keys(ret).filter(x => ret[x].comm && ret[x].args && ret[x].ppid && ret[x]['%cpu'] && ret[x]['%mem']).filter(x => parseInt(x, 10) !== mypid).map(x => {
			return {
				pid: Number.parseInt(x, 10),
				name: path.basename(ret[x].comm),
				cmd: ret[x].args,
				ppid: Number.parseInt(ret[x].ppid, 10),
				cpu: Number.parseFloat(ret[x]['%cpu']),
				memory: Number.parseFloat(ret[x]['%mem'])
			};
		});
	});
}

module.exports = process.platform === 'win32' ? win : def;
