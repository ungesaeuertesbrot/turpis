const Gio = imports.gi.Gio;

const Def = imports.turpis.definitions;

const TurpisDBusProxyClass = Gio.DBusProxy.makeProxyWrapper(Def.DBUS_INTERFACE);
const Turpis = new TurpisDBusProxyClass(Gio.DBus.session, Def.DBUS_NAME, Def.DBUS_PATH);

