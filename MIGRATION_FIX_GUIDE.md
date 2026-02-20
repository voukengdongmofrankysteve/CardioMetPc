# Guide de correction - Colonnes manquantes pour le stockage de fichiers

## Problème
Les colonnes `ecg_files` et `ett_files` sont manquantes dans la table `ecg_ett_exams`.

## Solution

### Méthode 1 : Via phpMyAdmin ou MySQL Workbench (RECOMMANDÉE)

1. **Ouvrez phpMyAdmin** ou **MySQL Workbench**
2. **Sélectionnez la base de données** : `cardio_ebogo`
3. **Cliquez sur l'onglet SQL**
4. **Copiez et collez** le contenu du fichier `fix_migration.sql`
5. **Cliquez sur "Exécuter"** ou "Go"

Le script va :
- Supprimer l'ancienne entrée de migration version 8
- Ajouter les colonnes `ecg_files` et `ett_files` si elles n'existent pas déjà
- Vérifier que les colonnes ont été ajoutées correctement

### Méthode 2 : Via ligne de commande MySQL

Si vous avez MySQL dans votre PATH :

```powershell
# Naviguez vers le dossier du projet
cd C:\Users\HP\Desktop\projet\CardioMetPc

# Exécutez le script
Get-Content fix_migration.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

Entrez le mot de passe : `51405492fS@`

### Méthode 3 : Manuellement via SQL

Exécutez ces commandes SQL dans votre client MySQL :

```sql
USE cardio_ebogo;

-- Supprimer l'ancienne migration
DELETE FROM _migrations WHERE version = 8;

-- Ajouter les colonnes
ALTER TABLE ecg_ett_exams 
ADD COLUMN ecg_files TEXT COMMENT 'JSON array of ECG file paths',
ADD COLUMN ett_files TEXT COMMENT 'JSON array of ETT file paths';
```

## Après la correction

1. **Redémarrez l'application Tauri**
2. **Testez l'upload de fichiers** dans la page de consultation
3. Les fichiers devraient maintenant être sauvegardés correctement

## Vérification

Pour vérifier que les colonnes ont été ajoutées :

```sql
USE cardio_ebogo;

DESCRIBE ecg_ett_exams;
```

Vous devriez voir `ecg_files` et `ett_files` dans la liste des colonnes.

## Notes importantes

- ⚠️ **Ne modifiez jamais une migration après qu'elle a été appliquée**
- ✅ **Créez toujours une nouvelle migration** pour les modifications futures
- 📝 **Le système de migration Tauri** garde une trace des migrations appliquées dans la table `_migrations`
