'use strict';
const util = require('util');
const path = require('path');
const childProcess = require('child_process');
const mypid = require('process').pid;
const os = require('os');
const TEN_MEGABYTES = 1000 * 1000 * 10;
const execFile = util.promisify(childProcess.execFile);

async function win(options = {}) {
	const perfprocArgs = options.processName ? `path, Win32_PerfFormattedData_PerfProc_Process, where, (, name, like, '${options.processName.split('.').shift()}%', )` : 'path, Win32_PerfFormattedData_PerfProc_Process';
	const processArgs = options.processName ? `process, where, (, name, like, '${options.processName}%', )` : 'process';
	const {includeSelf} = options;
	
	try {
		let { error, stdout, stderr } = await execFile('wmic', perfprocArgs.split(',').map(s => s.trim()).concat(['get', 'name,idprocess,PercentProcessorTime', '/format:csv']), {maxBuffer: TEN_MEGABYTES});

		let perfproc = stdout.trim().split(os.EOL);
		let header = perfproc.shift().split(',').map(l => l.trim().toLowerCase());
		perfproc = perfproc.map(l => l.split(',').map((value, index) => ({ [header[index]]: value })).reduce((a, c) => Object.assign(a, c)));

		({ stdout } = await execFile('wmic', processArgs.split(',').map(s => s.trim()).concat(['get', '*', '/format:csv']), {maxBuffer: TEN_MEGABYTES}));
		stdout = stdout.trim().split(os.EOL);
		header = stdout.shift().split(',').map(l => l.trim().toLowerCase());
		stdout = stdout.map(l => l.split(',').map((value, index) => ({ [header[index]]: value })).reduce((a, c) => Object.assign(a, c))).map(l => {
			let pid = Number.parseInt(l.processid, 10);
			return Object.assign(l, {
				pid,
				cmd: l.commandline,
				ppid: Number.parseInt(l.parentprocessid, 10),
				cpu: perfproc.find(record => Number.parseInt(record.idprocess) === pid)?.percentprocessortime/os.cpus().length,
				memory: Number.parseFloat(l.workingsetsize),
				platform: process.platform
			});
		});
		if (!includeSelf) stdout = stdout.filter(l => l.pid !== mypid);
		return stdout;
	} catch (error) {
		console.dir(error);
	}
}

async function nowin(options = {}) {
	const ret = {};
	const flags = (options.all === false ? '' : 'a') + 'wwxo';
	const {includeSelf} = options;

	let args = ['comm', 'args', 'ppid', 'uid', '%cpu', '%mem'].map(async cmd => {
		const {error, stdout, stderr} = await execFile('ps', [flags, `pid,${cmd}`], {maxBuffer: TEN_MEGABYTES});

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
	let filtered = await Promise.all(args).then(() => {
		// Filter out inconsistencies as there might be race
		// issues due to differences in `ps` between the spawns
		// TODO: Use `Object.entries` when targeting Node.js 8
		return Object.keys(ret).filter(x => ret[x].comm && ret[x].args && ret[x].ppid && ret[x]['%cpu'] && ret[x]['%mem'])
			.filter(includeSelfFilter)
			.map(x => {
				return {
					pid: Number.parseInt(x, 10),
					name: path.basename(ret[x].comm),
					cmd: ret[x].args,
					ppid: Number.parseInt(ret[x].ppid, 10),
					cpu: Number.parseFloat(ret[x]['%cpu']),
					memory: Number.parseFloat(ret[x]['%mem']),
					platform: process.platform
				};
			})
			.filter(processNameFilter);
	});
	function includeSelfFilter(element) {
		if (!includeSelf) return element;
		if (parseInt(element, 10) !== mypid) {
			return element;
		}
	}
	function processNameFilter(element) {
		if (!options.processName) return element;
		if (options.processName && element.name.toLowerCase().trim() === options.processName) {
			return element;
		}
	}
	return filtered;
}

module.exports = process.platform === 'win32' ? win : nowin;
