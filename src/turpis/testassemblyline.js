const Gio = imports.gi.Gio;
const Test = imports.turpis.test;

function TestAssemblyLine() {
	this._init();
}

TestAssemblyLine.prototype = {
	_init: function() {
		this._index = 0;
		this._defInitialized = false;
		this._dirInitialized = false;
	},
	
	set testDefinition(def) {
		if (typeof def !== "object" || def === null || !("tests" in def))
			throw new Error("Not a valid test definition");
		
		this._def = def;
		this._defInitialized = true;
	},
	
	get testDefinition() {
		return this._def;
	},
	
	set turpisDir(dir) {
		if (typeof dir === "string")
			dir = Gio.File.new_for_path(dir);
		if (!dir.query_exists(null))
			throw new Error("No such directory");
		
		this._turpisDir = dir.get_path();
	},
	
	get turpisDir() {
		return this._turpisDir;
	},
	
	set rootDir(dir) {
		if (typeof dir === "string")
			dir = Gio.File.new_for_path(dir);
		if (!dir.query_exists(null))
			throw new Error("No such directory");
		
		this._rootDir = dir;
		this._dirInitialized = true;
	},
	
	get rootDir() {
		return this._rootDir;
	},
	
	next: function() {
		if (!(this._defInitialized && this._dirInitialized))
			return undefined;
		if (this._index >= this._def.tests.length)
			return undefined;
		
		let testFileBaseName = "test" + this._def.tests[this._index++] + ".js";
		let testFile = this._rootDir.get_child(testFileBaseName);
		
		let test = new Test.Test(testFile, this);
		test.rootDir = this._rootDir;
		
		return test;
	},
};

