const Gio = imports.gi.Gio;

function getFilesInDir(dir, pattern) {
	let fileList = [];
	
	let e = dir.enumerate_children("standard::name,standard::type", Gio.FileQueryInfoFlags.NONE, null);

	let fileInfo;
	while ((fileInfo = e.next_file(null)) !== null) {
		let type = fileInfo.get_attribute_uint32("standard::type");
		if (type !== Gio.FileType.REGULAR)
			continue;
	
		let fn = fileInfo.get_attribute_byte_string("standard::name");
		if (pattern && !fn.match(pattern))
			continue;
		
		fileList.push(fn);
	}
	
	e.close(null);
	
	return fileList;
}

