const GLib = imports.gi.GLib;

function Test(file, searchPath) {
	this._init(file, searchPath);
}

Test.prototype = {
	_init: function(file, searchPath) {
		this._callback = function() {};
		this._rootDir = null;
		this._fn = typeof file === "string" ? file : file.get_path();
		
		this._argv = ["gjs-console"];
		for each (let p in searchPath)
			this._argv.push("-I", p);
		this._argv.push(this._fn);
	},
	
	get filename() {
		return this._fn;
	},
	
	set callback(cb) {
		if (typeof cb === "function")
			this._callback = cb;
	},
	
	get rootDir() {
		return this._rootDir;
	},
	
	set rootDir(dir) {
		if (typeof dir === "object")
			dir = dir.get_path();
		this._rootDir = dir;
	},
	
	run: function(callback) {
		if (callback)
			this.callback = callback;
		
		let [success, childPid, stdin, stdout, stderr] = GLib.spawn_async_with_pipes(
					this._rootDir,							// working directory
					this._argv,								// argv
					null,									// envp
					GLib.SpawnFlags.SEARCH_PATH
					| GLib.SpawnFlags.DO_NOT_REAP_CHILD,	// flags
					null									// child setup function
			);
		
		this._pid = childPid;
		this._stdout = stdout;
		this._stderr = stderr;
		
		GLib.child_watch_add(GLib.PRIORITY_DEFAULT_IDLE, childPid, this._onChildDone.bind(this));
		
		return childPid;
	},
	
	_onChildDone: function(pid, status) {
		let stdoutChannel = GLib.IOChannel.unix_new(this._stdout);
		let [outStatus, outStr] = stdoutChannel.read_to_end();
		stdoutChannel.shutdown(false);
		let stderrChannel = GLib.IOChannel.unix_new(this._stderr);
		let [errStatus, errStr] = stderrChannel.read_to_end();
		stderrChannel.shutdown(false);

		GLib.spawn_close_pid(pid);

		let success = true;
		try {
			GLib.spawn_check_exit_status(status);
		} catch (e) {
			success = false;
		}
		
		this._callback(pid, success, outStr, errStr);
	},
};

