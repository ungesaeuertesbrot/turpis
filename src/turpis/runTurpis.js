const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const System = imports.system;

String.prototype.format = imports.format.format;

var testDir;
// TODO: more sophisticated command line parsing
if (ARGV.length > 0) {
	testDir = Gio.File.new_for_path(ARGV[0]);
	if (testDir.query_file_type(Gio.FileQueryInfoFlags.NONE, null) !== Gio.FileType.DIRECTORY)
		testDir = undefined;
}
if (testDir === undefined)
	testDir = GLib.get_current_dir();

// extract default from current script's path. Logic stolen from
// gnome shell (misc/extensionUtils.js).
var stackLine = (new Error()).stack.split('\n')[0];
if (!stackLine)
	throw new Error('Could not find current file');

// The stack line is like:
//   init([object Object])@/home/user/data/gnome-shell/extensions/u@u.id/prefs.js:8
//
// In the case that we're importing from
// module scope, the first field is blank:
//   @/home/user/data/gnome-shell/extensions/u@u.id/prefs.js:8
var match = /@(.+):\d+/.exec(stackLine);
if (!match)
	throw new Error('Could not find current file');

const scriptFile = Gio.File.new_for_path(match[1]);
const turpisDir = scriptFile.get_parent();

imports.searchPath.push(turpisDir.get_path());

const TestConductor = imports.turpis.testconductor;
	
const conductor = new TestConductor.TestConductor(turpisDir, testDir);
conductor.runDBus();
conductor.run();

