const Gio = imports.gi.Gio;
const System = imports.system;

String.prototype.format = imports.format.format;

// TODO: more sophisticated command line parsing
if (ARGV.length !== 1) {
	printerr("You must provide the test directory as an argument to turpis");
	System.exit(-1);
}

let testDir = ARGV[0];

// extract default from current script's path. Logic stolen from
// gnome shell (misc/extensionUtils.js).
let stackLine = (new Error()).stack.split('\n')[0];
if (!stackLine)
	throw new Error('Could not find current file');

// The stack line is like:
//   init([object Object])@/home/user/data/gnome-shell/extensions/u@u.id/prefs.js:8
//
// In the case that we're importing from
// module scope, the first field is blank:
//   @/home/user/data/gnome-shell/extensions/u@u.id/prefs.js:8
let match = /@(.+):\d+/.exec(stackLine);
if (!match)
	throw new Error('Could not find current file');

let scriptFile = Gio.File.new_for_path(match[1]);
let turpisDir = scriptFile.get_parent();

imports.searchPath.push(turpisDir.get_path());

const Conductor = imports.turpis.testconductor;
	
let conductor = new Conductor.TestConductor(testDir);
conductor.runDBus();
conductor.run();

