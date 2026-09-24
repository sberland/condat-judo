// Anonymisation de la qualification (spec 008), testée sur une vraie base SQLite (node:sqlite) :
// migrations appliquées, données fictives insérées, puis anonymisation-qualif.sql.
import { readdirSync, readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { TABLES } from './donnees-personnelles'

const dossier = fileURLToPath(new URL('.', import.meta.url))
const lire = (fichier: string) => readFileSync(dossier + fichier, 'utf8')
const ANONYMISATION = lire('anonymisation-qualif.sql')

type Ligne = Record<string, unknown>

function baseMigree(): DatabaseSync {
  const db = new DatabaseSync(':memory:')
  for (const f of readdirSync(dossier + 'migrations').filter((f) => f.endsWith('.sql')).sort()) db.exec(lire(`migrations/${f}`))
  return db
}

// Jeu couvrant tous les cas : famille, testeur du bureau, adulte adhérent qui a un rôle,
// personne autorisée, session et lien de connexion.
function baseRemplie(): DatabaseSync {
  const db = baseMigree()
  db.exec(`
    INSERT INTO users (id, prenom, nom, email, telephone) VALUES
      (1, 'Alice', 'Bureau', 'alice.bureau@club.test', '06 11 11 11 11'),
      (2, 'Paul', 'Parent', 'paul.parent@famille.test', '06 22 22 22 22'),
      (3, 'Zoé', 'Sanstel', NULL, NULL),
      (4, 'Marc', 'Adulte', 'marc.adulte@club.test', '06 44 44 44 44');
    INSERT INTO user_roles (user_id, role) VALUES (1, 'admin'), (4, 'encadrant');
    INSERT INTO identites (provider, subject, user_id, email_vu) VALUES
      ('app', '1', 1, 'alice.bureau@club.test'), ('app', '2', 2, 'paul.parent@famille.test');
    INSERT INTO adherents (id, prenom, nom, date_naissance, sexe, grade, numero_licence, adresse, code_postal, ville, user_id) VALUES
      (1, 'Tom', 'Parent', '2016-03-09', 'M', 'Jaune', 'M123456', '3 rue Réelle', '87920', 'Condat-sur-Vienne', NULL),
      (2, 'Léna', 'Parent', '2019-11-28', 'F', NULL, NULL, NULL, NULL, NULL, NULL),
      (3, 'Marc', 'Adulte', '1980-05-05', 'M', 'Noire', 'M999999', '9 rue Vraie', '87170', 'Isle', 4);
    INSERT INTO liens (user_id, adherent_id, qualite) VALUES (2, 1, 'pere'), (2, 2, 'pere'), (3, 2, 'mere');
    INSERT INTO personnes_autorisees (adherent_id, prenom, nom, lien, telephone) VALUES (1, 'Mamie', 'Réelle', 'grand-mère', '06 55 55 55 55');
    INSERT INTO sessions (empreinte, user_id, expire_le) VALUES ('e1', 2, datetime('now', '+1 day'));
    INSERT INTO liens_connexion (empreinte, user_id, expire_le) VALUES ('l1', 2, datetime('now', '+1 day'));
    INSERT INTO adhesions (id, adherent_id, saison, formule, montant_participation, montant_licence, montant_supplements,
      montant_reduction, montant_total, echeance_1, echeance_2, echeance_3) VALUES
      (1, 1, '2026-2027', 'judo-poussins-juniors', 10100, 4600, 0, 0, 14700, 8000, 3400, 3300);
    INSERT INTO paiements (id, saison, montant, mode, reference, recu_le) VALUES
      (1, '2026-2027', 14700, 'cheque', 'Chèque 1234567 — Banque Réelle — P. Parent', '2026-09-10'),
      (2, '2026-2027', 500, 'especes', NULL, '2026-09-11');
    INSERT INTO paiement_parts (paiement_id, adhesion_id, montant) VALUES (1, 1, 14700), (2, 1, 500);
    INSERT INTO garderie_demandes (adherent_id, date, lieu, recupere_le, parti_le, parti_avec) VALUES
      (1, '2026-09-30', 'École', '2026-09-30 14:30:00', '2026-09-30 16:05:00', 'Mamie Réelle (grand-mère)');
    INSERT INTO photos_adherents (adherent_id, image, type) VALUES (1, 'AAAA', 'image/jpeg');
  `)
  return db
}

const toutes = (db: DatabaseSync, table: string) => db.prepare(`SELECT rowid AS _rowid, * FROM ${table} ORDER BY rowid`).all() as Ligne[]

describe('anonymisation de la qualif — classement des colonnes', () => {
  it('chaque colonne de la base est classée dans donnees-personnelles.ts, sans entrée obsolète', () => {
    const db = baseMigree()
    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]).map(
      (t) => t.name,
    )
    const reelles = tables.flatMap((t) => (db.prepare(`SELECT name FROM pragma_table_info('${t}')`).all() as { name: string }[]).map((c) => `${t}.${c.name}`))
    const classees = Object.entries(TABLES).flatMap(([t, { colonnes }]) => Object.keys(colonnes).map((c) => `${t}.${c}`))
    expect(reelles.filter((c) => !classees.includes(c)), 'colonnes à classer (et à anonymiser si personnelles)').toEqual([])
    expect(classees.filter((c) => !reelles.includes(c)), 'entrées obsolètes').toEqual([])
  })
})

describe('anonymisation de la qualif — effet', () => {
  const avant = baseRemplie()
  const apres = baseRemplie()
  apres.exec(ANONYMISATION)

  it('aucune valeur réelle ne subsiste dans une colonne pseudonymisée (hors comptes des testeurs)', () => {
    for (const [table, { conserveesSi, colonnes }] of Object.entries(TABLES)) {
      const pseudo = Object.entries(colonnes).filter(([, t]) => t === 'pseudonymisee').map(([c]) => c)
      if (!pseudo.length) continue
      const filtre = conserveesSi ? `WHERE NOT (${conserveesSi})` : ''
      const lignesAvant = avant.prepare(`SELECT * FROM ${table} ${filtre}`).all() as Ligne[]
      const lignesApres = apres.prepare(`SELECT * FROM ${table} ${filtre}`).all() as Ligne[]
      expect(lignesApres.length, table).toBe(lignesAvant.length)
      for (const c of pseudo) {
        const reelles = new Set(lignesAvant.map((l) => l[c]).filter((v) => v !== null))
        for (const l of lignesApres) expect(reelles.has(l[c]), `${table}.${c} = ${String(l[c])}`).toBe(false)
      }
    }
  })

  it('les comptes des testeurs (avec rôle) et leur fiche d’adhérent sont conservés tels quels', () => {
    for (const [table, { conserveesSi }] of Object.entries(TABLES)) {
      if (!conserveesSi) continue
      const q = `SELECT * FROM ${table} WHERE ${conserveesSi} ORDER BY rowid`
      expect(apres.prepare(q).all(), table).toEqual(avant.prepare(q).all())
    }
    expect(apres.prepare('SELECT count(*) AS n FROM users WHERE email = ?').get('alice.bureau@club.test')).toEqual({ n: 1 })
  })

  it('les tables purgées sont vides', () => {
    for (const [table, { colonnes }] of Object.entries(TABLES)) {
      if (Object.values(colonnes).every((t) => t === 'purgee')) expect(toutes(apres, table), table).toEqual([])
    }
  })

  it('les liens parent ↔ enfant et les rôles restent intacts', () => {
    expect(toutes(apres, 'liens')).toEqual(toutes(avant, 'liens'))
    expect(toutes(apres, 'user_roles')).toEqual(toutes(avant, 'user_roles'))
  })

  it('l’année de naissance est conservée (catégories), les absences aussi', () => {
    const ans = (db: DatabaseSync) => db.prepare('SELECT substr(date_naissance, 1, 4) AS an FROM adherents ORDER BY id').all()
    expect(ans(apres)).toEqual(ans(avant))
    expect(apres.prepare('SELECT email, telephone FROM users WHERE id = 3').get()).toEqual({ email: null, telephone: null })
    expect(apres.prepare('SELECT numero_licence, adresse FROM adherents WHERE id = 2').get()).toEqual({ numero_licence: null, adresse: null })
  })

  it('reste idempotente (recopie suivante)', () => {
    const snap = (db: DatabaseSync) => ['users', 'adherents', 'personnes_autorisees'].map((t) => toutes(db, t))
    const une = snap(apres)
    apres.exec(ANONYMISATION)
    expect(snap(apres)).toEqual(une)
  })
})
