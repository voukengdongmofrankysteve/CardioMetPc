# 🔧 Correction de la base de données - Fichiers manquants

## ⚠️ Problème actuel

L'erreur suivante apparaît lors de la sauvegarde d'une consultation :
```
Unknown column 'ecg_files' in 'field list'
```

## ✅ Solution rapide (5 minutes)

### Étape 1 : Ouvrir phpMyAdmin

1. Ouvrez **XAMPP Control Panel** (ou votre gestionnaire MySQL)
2. Cliquez sur **Admin** à côté de MySQL
3. phpMyAdmin s'ouvre dans votre navigateur

### Étape 2 : Sélectionner la base de données

1. Dans le panneau de gauche, cliquez sur **`cardio_ebogo`**
2. Cliquez sur l'onglet **SQL** en haut

### Étape 3 : Exécuter le script de correction

1. **Copiez** tout le contenu ci-dessous :

```sql
USE cardio_ebogo;

-- Supprimer l'ancienne migration problématique
DELETE FROM _migrations WHERE version = 8;

-- Ajouter les colonnes manquantes
ALTER TABLE ecg_ett_exams 
ADD COLUMN ecg_files TEXT COMMENT 'JSON array of ECG file paths',
ADD COLUMN ett_files TEXT COMMENT 'JSON array of ETT file paths';

-- Vérifier que tout est OK
SELECT 'Migration réussie !' AS status;
```

2. **Collez** dans la zone de texte SQL
3. Cliquez sur **Exécuter** (bouton en bas à droite)

### Étape 4 : Redémarrer l'application

1. Fermez l'application CardioPc
2. Relancez-la avec `npm run tauri dev`
3. Testez l'upload de fichiers dans une consultation

## ✨ C'est tout !

Vos fichiers ECG et ETT seront maintenant sauvegardés correctement.

---

## 🐛 En cas de problème

### Erreur : "Duplicate column name"

Si vous obtenez cette erreur, les colonnes existent déjà. Exécutez juste ceci :

```sql
DELETE FROM _migrations WHERE version = 8;
```

Puis redémarrez l'application.

### Les fichiers ne s'uploadent toujours pas

1. Vérifiez que les colonnes existent :
   ```sql
   DESCRIBE ecg_ett_exams;
   ```
   Vous devez voir `ecg_files` et `ett_files` dans la liste

2. Vérifiez les permissions Tauri dans `src-tauri/capabilities/default.json`

3. Consultez les logs de la console du navigateur (F12)

---

## 📚 Fichiers créés pour vous aider

- ✅ `fix_migration.sql` - Script SQL complet avec vérifications
- ✅ `fix-database.ps1` - Script PowerShell automatique (si MySQL dans PATH)
- ✅ `MIGRATION_FIX_GUIDE.md` - Guide détaillé

---

## 💡 Pourquoi ce problème ?

Une migration de base de données a été modifiée après avoir été appliquée. Le système de migration Tauri détecte ce changement et refuse de l'appliquer à nouveau pour protéger vos données.

**Règle d'or** : Ne jamais modifier une migration déjà appliquée, toujours en créer une nouvelle !
