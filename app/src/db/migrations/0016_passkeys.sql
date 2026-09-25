-- Connexion par passkey (Face ID, empreinte, code du téléphone) — spec 005c, facultative.
-- Seule la clé PUBLIQUE est en base, rattachée à users.id (jamais à l'e-mail) ; la clé privée ne
-- quitte pas le téléphone. Une passkey est liée à l'adresse du site (identifiant de la « partie
-- de confiance ») : à refaire après un changement de nom de domaine.

CREATE TABLE passkeys (
  id                   TEXT    PRIMARY KEY,                   -- identifiant de la passkey (base64url)
  user_id              INTEGER NOT NULL REFERENCES users(id),
  cle_publique         TEXT    NOT NULL,                      -- base64url (COSE)
  compteur             INTEGER NOT NULL DEFAULT 0,
  transports           TEXT,                                  -- JSON (« internal », « hybrid »…)
  appareil             TEXT,                                  -- libellé : « iPhone · Safari »
  created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  derniere_utilisation TEXT
);

CREATE INDEX idx_passkeys_user ON passkeys (user_id);

-- Défis à usage unique (5 minutes) : enregistrement (compte connecté) ou connexion (anonyme).
CREATE TABLE defis_passkey (
  defi      TEXT    PRIMARY KEY,
  type      TEXT    NOT NULL CHECK (type IN ('enregistrement', 'connexion')),
  user_id   INTEGER REFERENCES users(id),
  expire_le TEXT    NOT NULL
);
