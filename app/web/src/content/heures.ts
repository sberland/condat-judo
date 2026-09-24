// Format des heures (« 18:30 » → « 18 h 30 »), commun au référentiel et à la garderie.

/** « 18:30 » → « 18 h 30 » ; « 18:00 » → « 18 h ». */
export const heure = (hhmm: string) => {
  const [h = '', m = ''] = hhmm.split(':')
  return m === '00' ? `${Number(h)} h` : `${Number(h)} h ${m}`
}
