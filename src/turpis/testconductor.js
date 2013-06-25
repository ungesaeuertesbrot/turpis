const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;

const Defs = imports.turpis.definitions;
const AssemblyLine = imports.turpis.testassemblyline;
const Util = imports.turpis.util;

const MAINLOOP_ID = "turpisMain";

function TestConductor(dir) {
	this._init(dir);
}

TestConductor.prototype = {
	_init: function(dir) {
		this._children = [];
		this._success = true;
		// Must exist before setting the root directory
		this._assemblyLine = new AssemblyLine.TestAssemblyLine();

		if (typeof dir === "string")
			this.TestRootDir = dir;
		else
			this.rootDir = dir;
		
		this._dbusWrapper = Gio.DBusExportedObject.wrapJSObject(Defs.DBUS_INTERFACE, this);
		this._dbusWrapper.export(Gio.DBus.session, Defs.DBUS_PATH);
	},
	
	set rootDir(dir) {
		this._rootDir = dir;

		let testDef;
		let testDefFile = dir.get_child(Defs.UNIT_DEFINITION_FILE);
		if (testDefFile.query_exists(null)) {
			let [success, testDefStr, testDefLen, eTag] = testDefFile.load_contents(null);
			testDef = JSON.parse(testDefStr.toString());
		} else {
			let fileList = Util.getFilesInDir(dir, /^test\w*\.js$/);
			for (let i = 0; i < fileList.length; i++)
				fileList[i] = fileList[i].substring(4, fileList[i].length);
	
			let srcDir = dir.get_parent().get_child("src");
			testDef = {
				tests: fileList,
				searchPath: srcDir.get_path()
			};
		}

		if (testDef.tests.length === 0)
			throw new Error("No tests defined. Aborting.");
		
		this._assemblyLine.rootDir = dir;
		this._assemblyLine.testDefinition = testDef;
	},
	
	get rootDir() {
		return this._rootDir;
	},
	
	runDBus: function() {
		Gio.DBus.session.own_name(Defs.DBUS_NAME, Gio.BusNameOwnerFlags, null, null, null);
	},
	
	run: function() {
		Mainloop.idle_add(this._startNextChild.bind(this));
		
		Mainloop.run(MAINLOOP_ID);
		
		print(this._success ? "All tests passed" : "Some tests failed");
	},
	
	_startNextChild: function() {
		let test = this._assemblyLine.next();
		if (test === undefined) {
			if (this._children.length === 0)
				Mainloop.quit(MAINLOOP_ID);
			return;
		}
		
		print("Running tests from file %s…".format(test.filename));
		
		let pid = test.run(this._onChildDone.bind(this));
		this._children.push(pid);
	},
	
	_onChildDone: function(pid, success, stdout, stderr) {
		if (stdout.length > 0)
			print("The tests said:\n" + stdout);
		if (stderr.length > 0)
			print("JSUnit said:\n" + stderr);
		
		if (!success)
			this._success = false;
		
		this._children.splice(this._children.indexOf(pid), 1);
		
		this._startNextChild();
	},
	
	Abort: function() {
		Mainloop.quit(MAINLOOP_ID);
	},
	
	set TestRootDir(dir) {
		this.rootDir = Gio.File.new_for_path(dir);
	},
	
	get TestRootDir() {
		return this.rootDir.get_path();
	},
};

