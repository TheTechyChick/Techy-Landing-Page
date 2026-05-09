# Ultimate Deployment Cheat Sheet
### Pushing ThatTechyChick LLC to GitHub & Hosting Live on Vercel

This guide walks you through three things, in order:
1. Pushing your website code to a brand new GitHub repository.
2. Connecting that repository to Vercel and deploying it live.
3. The simple workflow you will use **every single time** you want to update your live site after making changes.

> **Before you start, make sure you have:**
> - A GitHub account ([github.com](https://github.com))
> - Git installed on Windows ([git-scm.com/download/win](https://git-scm.com/download/win))
>   - To check if Git is already installed, open PowerShell and run: `git --version`
> - Your project folder (`C:\Users\trent\OneDrive\Documents\Web Design`) ready to go.

---

## Part 1: GitHub Setup

### Step 1.1 — Open PowerShell in your project folder

1. Open File Explorer and go to: `C:\Users\trent\OneDrive\Documents\Web Design`
2. Click the **address bar** at the top, type `powershell`, and press **Enter**.
3. A blue/black PowerShell window will open, already pointed at your project folder.

You can verify you are in the right place by running:
```powershell
pwd
```
You should see `C:\Users\trent\OneDrive\Documents\Web Design`.

### Step 1.2 — One-time Git setup (only if you have never used Git before)

Tell Git who you are. Use the same email you used for GitHub.
```powershell
git config --global user.name "Tabitha"
git config --global user.email "your-github-email@example.com"
```

### Step 1.3 — Initialize Git in your project

This turns your folder into a Git repository.
```powershell
git init
```
You should see a message like `Initialized empty Git repository in ...`.

### Step 1.4 — Set the default branch to `main`

GitHub uses `main` as the default branch name. Make Git match that:
```powershell
git branch -M main
```

### Step 1.5 — (Recommended) Add a `.gitignore` file

This prevents junk files from being uploaded. Create the file:
```powershell
New-Item -Path .gitignore -ItemType File
```
Open `.gitignore` in your editor and paste in:
```
# OS / editor noise
.DS_Store
Thumbs.db
.vscode/
.idea/

# Node (only if you ever add npm packages later)
node_modules/

# Logs
*.log
```
Save and close the file.

### Step 1.6 — Stage all your files

This tells Git: "I want to track every file in this folder."
```powershell
git add .
```

Verify what was staged:
```powershell
git status
```
You should see your files (`index.html`, `styles.css`, `script.js`, the `Reference/` folder, etc.) listed in green under "Changes to be committed".

### Step 1.7 — Make your first commit

A commit is a saved snapshot of your code.
```powershell
git commit -m "Initial commit: ThatTechyChick LLC landing page"
```

### Step 1.8 — Create the GitHub repository (in your browser)

1. Go to [github.com/new](https://github.com/new).
2. **Repository name:** `thattechychick-website` (or any name you like).
3. **Description:** *(optional)* "Landing page for ThatTechyChick LLC".
4. **Visibility:** Choose **Public** (Vercel works with both, but Public is simplest for a free site).
5. **DO NOT** check the boxes for "Add a README", ".gitignore", or "license". You already have local files, and adding these on GitHub will cause a conflict on first push.
6. Click **Create repository**.

GitHub will now show you a page with commands. **Ignore most of them** and just copy the URL of your new repo. It will look like:
```
https://github.com/YOUR-USERNAME/thattechychick-website.git
```

### Step 1.9 — Connect your local folder to GitHub

In PowerShell, run this (replace `YOUR-USERNAME` with your real GitHub username):
```powershell
git remote add origin https://github.com/YOUR-USERNAME/thattechychick-website.git
```

Verify the connection worked:
```powershell
git remote -v
```
You should see two lines pointing to your repo URL.

### Step 1.10 — Push your code to GitHub

```powershell
git push -u origin main
```

The `-u` flag links your local `main` branch to the GitHub `main` branch so future pushes are simpler.

A login window may pop up. **Sign in to GitHub** in that window to authenticate. Once it finishes, refresh your GitHub repo page in the browser. **You should see all your files there.** 🎉

---

### Part 1 Troubleshooting

| Problem | What it means | How to fix it |
|---|---|---|
| `git : The term 'git' is not recognized` | Git is not installed or not on your PATH. | Install Git from [git-scm.com](https://git-scm.com/download/win). Restart PowerShell after installing. |
| `fatal: not a git repository` | You forgot `git init`, or you are in the wrong folder. | Run `pwd` to check the folder, then `git init`. |
| `error: remote origin already exists` | You already ran `git remote add origin` once. | Run `git remote remove origin` and try Step 1.9 again. |
| `error: failed to push some refs` / `rejected (fetch first)` | The GitHub repo has commits your local copy does not (usually because you checked the README/.gitignore box on GitHub). | Run `git pull origin main --allow-unrelated-histories`, resolve any conflicts, then `git push` again. |
| Authentication popup keeps failing | Wrong password, or your account uses two-factor auth. | Use **GitHub Desktop** OR create a Personal Access Token: GitHub > Settings > Developer settings > Personal access tokens > generate one and use it as your password. |
| `Updates were rejected because the tip of your current branch is behind` | The remote has newer commits than your local. | `git pull origin main` first, then `git push`. |
| `LF will be replaced by CRLF` warning | Just a line-ending notice on Windows. **This is not an error.** | Safe to ignore. |
| Files in `Reference/` are huge and push is slow | Large images. | This is fine for now. If a single file is over 100 MB, GitHub will reject it and you should remove or compress that file. |

---

## Part 2: Vercel Deployment

Vercel is a free hosting platform that watches your GitHub repo and **auto-deploys every time you push**. No FTP, no build commands needed for a static HTML/CSS/JS site like yours.

### Step 2.1 — Create a Vercel account

1. Go to [vercel.com/signup](https://vercel.com/signup).
2. Click **Continue with GitHub**.
3. Authorize Vercel to access your GitHub account.
4. When asked about your "team", choose the **Hobby (Free)** plan and enter your name.

### Step 2.2 — Import your repository

1. Once logged in, click **Add New...** in the top right, then **Project**.
2. Vercel will show a list of your GitHub repositories. Find `thattechychick-website` and click **Import**.
   - If you do not see your repo, click **Adjust GitHub App Permissions** and grant Vercel access to that repository.

### Step 2.3 — Configure the project

Vercel auto-detects most settings. For a plain static site (HTML/CSS/JS), you can leave **everything at default**:

- **Framework Preset:** `Other` (Vercel will pick this automatically).
- **Root Directory:** `./` (leave it).
- **Build Command:** *(leave blank)*
- **Output Directory:** *(leave blank)*
- **Install Command:** *(leave blank)*

Click **Deploy**.

### Step 2.4 — Watch the magic happen

Vercel will spend ~30 seconds building and uploading. When it finishes, you will see a **confetti animation** and a screenshot of your live site.

Click **Continue to Dashboard** or click the screenshot to visit your live site. Your URL will look like:
```
https://thattechychick-website.vercel.app
```
**Your site is now live on the internet.** 🚀

### Step 2.5 — (Optional) Add a custom domain later

If you buy a domain like `thattechychick.com`:
1. In Vercel, go to your project > **Settings** > **Domains**.
2. Type your domain and click **Add**.
3. Vercel will give you DNS records to paste into your domain registrar (Namecheap, GoDaddy, etc.). Follow their on-screen instructions.

---

### Part 2 Troubleshooting

| Problem | How to fix it |
|---|---|
| "No repositories found" in Vercel | Click **Adjust GitHub App Permissions** and explicitly grant access to the repo. |
| Site loads but CSS/JS is missing | Check that your `index.html` references `styles.css` and `script.js` with **relative paths** (`href="styles.css"`, not `/Users/.../styles.css`). |
| Images broken | Same fix: relative paths only (`src="Reference/logo.png"`, not absolute paths). Also check that file name capitalization matches exactly. Vercel is case-sensitive; Windows is not. `Logo.PNG` and `logo.png` are different on Vercel. |
| Build failed | For a static site, this almost never happens. If it does, click **View Build Logs** in Vercel to see the error, and make sure no Build Command is set. |
| Changes are not appearing on the live site | Vercel only redeploys when you `git push`. See Part 3 below. |

---

## Part 3: Future Updates Workflow (Your Daily Cheat Sheet)

This is the section you will use **forever** going forward. Once steps 1 and 2 are done, updating your live site is a 3-command process.

### The Lifecycle

Every time you change any file (HTML, CSS, JS, images, anything):

```powershell
git add .
git commit -m "Describe what you changed"
git push
```

That's it. Vercel sees the push, rebuilds in ~30 seconds, and your live site updates automatically.

### Step-by-Step Walkthrough

**1. Open PowerShell in your project folder** (same as Step 1.1).

**2. Check what changed:**
```powershell
git status
```
Files in red are modified but not staged. Files in green are staged.

**3. Stage your changes:**
```powershell
git add .
```
The `.` means "every changed file in this folder". You can also stage one specific file: `git add styles.css`.

**4. Commit your changes** with a clear message (write it in present tense, describing what the change does):
```powershell
git commit -m "Update hero section copy"
```
Other good examples:
- `git commit -m "Fix mobile layout on contact section"`
- `git commit -m "Add new logo to navigation"`
- `git commit -m "Change phone number color to match brand"`

**5. Push to GitHub:**
```powershell
git push
```

**6. Watch Vercel deploy automatically.**
- Open [vercel.com/dashboard](https://vercel.com/dashboard).
- Click your project. You will see a new deployment "Building" at the top.
- Once it shows "Ready" (green dot), refresh your live site in your browser to see the changes.

> 💡 **Tip:** Hard-refresh with **Ctrl + F5** to bypass your browser cache if changes do not appear right away.

### The Quick-Reference Card

```text
WHAT I DID            COMMAND
─────────────────────────────────────────────────
Made changes to files git status        (see what changed)
Ready to save them    git add .         (stage everything)
Save the snapshot     git commit -m "..."
Send to GitHub/Vercel git push
Site auto-updates     (no command — Vercel handles it)
```

### Bonus: Useful Day-to-Day Commands

| Goal | Command |
|---|---|
| See your full commit history | `git log --oneline` |
| See exactly what you changed (before staging) | `git diff` |
| Discard ALL local changes since last commit (careful!) | `git restore .` |
| Pull latest changes from GitHub (if editing on multiple machines) | `git pull` |
| See which files Git is ignoring | `git status --ignored` |

---

### Part 3 Troubleshooting

| Problem | How to fix it |
|---|---|
| `nothing to commit, working tree clean` | You did not actually change any files, or you already committed them. |
| `Please tell me who you are` | Run the `git config` commands from Step 1.2. |
| `error: src refspec main does not match any` | You have not committed anything yet. Run `git commit -m "..."` first. |
| Site updated on GitHub but not on Vercel | Open Vercel dashboard. If the deployment has a red "Failed" badge, click it and read the build log. For static sites this is almost always a typo in `index.html`. |
| Pushed something I shouldn't have (a password, secret, etc.) | **Immediately** rotate the secret. Then ask for help removing it from Git history. Do not just delete the file and push, the secret remains in history. |
| Want to undo your last commit but keep the changes | `git reset --soft HEAD~1` |

---

## You're Done!

You now have:
- ✅ Code on GitHub (versioned and backed up forever).
- ✅ A live, public website on Vercel.
- ✅ A 3-command workflow (`add`, `commit`, `push`) for every future update.

Bookmark this file. The Quick-Reference Card in Part 3 is what you will reach for 99% of the time.
