/*
 * Pont vers les fonctions natives quand l'app tourne dans l'APK Android (Capacitor).
 * Dans le navigateur, tout est inactif et l'app garde son comportement web.
 */
const C = typeof window !== 'undefined' ? window.Capacitor : null;

export const isNative = !!C?.isNativePlatform?.();

const plugin = (name) => {
  if (!isNative) return null;
  try {
    return C.registerPlugin ? C.registerPlugin(name) : C.Plugins?.[name] || null;
  } catch {
    return C.Plugins?.[name] || null;
  }
};

const LN = plugin('LocalNotifications');
const KA = plugin('KeepAwake');
const REST_ID = 4242;

/** Notification Android programmée : fiable même écran verrouillé (AlarmManager). */
export const nativeNotif = {
  async ensurePermission() {
    if (!LN) return false;
    try {
      let p = await LN.checkPermissions();
      if (p.display !== 'granted') p = await LN.requestPermissions();
      return p.display === 'granted';
    } catch { return false; }
  },
  async scheduleRest(endsAt, body) {
    if (!LN) return;
    try {
      await LN.cancel({ notifications: [{ id: REST_ID }] });
      if (endsAt <= Date.now() + 1000) return;
      await LN.schedule({
        notifications: [{
          id: REST_ID,
          title: 'Repos terminé',
          body,
          schedule: { at: new Date(endsAt), allowWhileIdle: true },
          smallIcon: 'ic_stat_charge',
          iconColor: '#E6C14A',
        }],
      });
    } catch { /* permission refusée */ }
  },
  async cancelRest() {
    if (!LN) return;
    try { await LN.cancel({ notifications: [{ id: REST_ID }] }); } catch { /* rien */ }
  },
};

/** Écran allumé pendant la séance. */
export const nativeAwake = {
  async set(on) {
    if (!KA) return false;
    try {
      if (on) await KA.keepAwake(); else await KA.allowSleep();
      return true;
    } catch { return false; }
  },
};

/** Couleur des icônes de la barre d'état selon le thème (APK). */
const SB = plugin('SystemBars');
export const nativeTheme = (theme) => {
  try { SB?.setStyle({ style: theme === 'light' ? 'LIGHT' : 'DARK' }); } catch { /* rien */ }
};
