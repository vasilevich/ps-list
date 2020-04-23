# ps-list [![Build Status](https://travis-ci.org/june07/ps-list.svg?branch=master)](https://travis-ci.org/june07/ps-list)

> Get running processes

Works on macOS, Linux, and Windows.


## Install

```
$ npm install @667/ps-list
```


## Usage

```js
const psList = require('@667/ps-list');

(async () => {
	console.log(await psList());
	//=> [{pid: 3213, name: 'node', cmd: 'node test.js', ppid: 1, uid: 501, cpu: 0.1, memory: 1.5}, …]
})();
```

or on Windows:

```
	/*
	=> [{caption: "node.exe", 
		cmd: "node   "C:\..\nodemon.js" test.js",
		commandline: "node   "C:\..\nodemon.js" --inspect test.js",
		cpu: 0,
		creationclassname: "Win32_Process",
		creationdate: "20200421203634.377920-420",
		cscreationclassname: "Win32_ComputerSystem",
		csname: "DESKTOP-ARG34AZ",
		description: "node.exe",
		executablepath: "C:\Program Files\nodejs\node.exe",
		executionstate: "",
		handle: "12604",
		handlecount: "173",
		installdate: "",
		kernelmodetime: "4687500",
		maximumworkingsetsize: "1380",
		memory: 19742720,
		minimumworkingsetsize: "200",
		name: "node.exe",
		node: "DESKTOP-ARG34AZ",
		oscreationclassname: "Win32_OperatingSystem",
		osname: "Microsoft Windows 10 Pro|C:\WINDOWS|",
		otheroperationcount: "9878",
		othertransfercount: "396344",
		pagefaults: "14660",
		pagefileusage: "16584",
		parentprocessid: "10976",
		peakpagefileusage: "23184",
		peakvirtualsize: "4587802624",
		peakworkingsetsize: "31452",
		pid: 12604,
		ppid: 10976,
		priority: "8",
		privatepagecount: "16982016",
		processid: "12604",
		quotanonpagedpoolusage: "19",
		quotapagedpoolusage: "170",
		quotapeaknonpagedpoolusage: "22",
		quotapeakpagedpoolusage: "206",
		readoperationcount: "312",
		readtransfercount: "557407",
		sessionid: "1",
		status: "",
		terminationdate: "",
		threadcount: "14",
		usermodetime: "5312500",
		virtualsize: "4586491904",
		windowsversion: "10.0.19041",
		workingsetsize: "28581888",
		writeoperationcount: "1",
		writetransfercount: "55"}, …]
	*/
```

> The `uid` property is not yet supported on Windows.


## API

### psList([options])

Returns a `Promise<Array>` with the running processes.

#### options

Type: `Object`

##### all

Type: `boolean`<br>
Default: `true`

Return other users' processes as well as your own.

On Windows this has no effect and will always be the users' own processes.


## License

MIT © [June07](https://june07.com)
