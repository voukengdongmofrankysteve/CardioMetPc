Here is the **full step-by-step commands** to push your code and trigger a Tauri release on **GitHub**.

Follow them exactly 👇

---

# ✅ 1. Commit and push your latest code

Run inside your project folder:

```bash
git add .
git commit -m "prepare release"
git push origin main
```

(or replace `main` with your branch)

---

# ✅ 2. Bump your app version (VERY IMPORTANT)

Open:

```
src-tauri/tauri.conf.json
```

Change:

```json
"version": "0.1.0"
```

to something newer, for example:

```json
"version": "0.1.1"
```

Save the file.

Then commit the version change:

```bash
git add .
git commit -m "bump version to 0.1.1"
git push origin main
```

---

# ✅ 3. Create a Git tag (this triggers the release)

Run:

```bash
git tag v0.1.1
git push origin v0.1.1
```

⚠️ The tag **must match your version**.

---

# ✅ 4. What happens automatically now

GitHub Actions will:

✔ build your Tauri app
✔ sign it
✔ create a GitHub release
✔ upload installers
✔ generate `latest.json`

You don’t need to do anything else.

---

# ✅ 5. After workflow finishes

Check your updater file:

```
https://github.com/voukengdongmofrankysteve/CardioMetPc/releases/latest/download/latest.json
```

If it opens → auto-update works 🎉

---

# 📌 Quick release checklist (copy this)

```bash
git add .
git commit -m "release prep"
git push origin main

# bump version in tauri.conf.json first

git add .
git commit -m "version bump"
git push origin main

git tag vX.X.X
git push origin vX.X.X
```

---

If you want, I can also give you:

✅ a command to delete a wrong tag
✅ how to redo a release
✅ how to test updater locally before publishing

Just tell me which one you want next.
