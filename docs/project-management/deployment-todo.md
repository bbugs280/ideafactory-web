# IdeaFactory Website — Deployment Checklist

## Pre-Deployment ✓

- [x] Create HTML structure (index.html)
- [x] Build responsive dark-theme CSS (assets/css/style.css)
- [x] Implement navigation & interactivity (assets/js/main.js)
- [x] Create favicon (assets/images/favicon.svg)
- [x] Set up .gitignore & .nojekyll
- [x] Create CNAME file with domain (ideafactory.one)

## GitHub Pages Setup

- [ ] Push all files to `main` branch
- [ ] Go to repo Settings → Pages
- [ ] Set Source: "Deploy from a branch"
- [ ] Select branch: `main`, folder: `/` (root)
- [ ] Wait for the green checkmark — site will be live at `https://<username>.github.io`

## Domain Configuration (NameCheap)

### A Records (4 required)
- [ ] Add A record: `@` → `185.199.108.153`
- [ ] Add A record: `@` → `185.199.109.153`
- [ ] Add A record: `@` → `185.199.110.153`
- [ ] Add A record: `@` → `185.199.111.153`

### CNAME Record
- [ ] Add CNAME record: `www` → `<your-github-username>.github.io`

**Note:** Replace `<your-github-username>` with your actual GitHub username.

## Verification & SSL

- [ ] DNS records added in NameCheap
- [ ] Wait up to 48 hours for DNS propagation (usually 10–30 minutes)
- [ ] Visit `https://ideafactory.one` — should resolve to your site
- [ ] Verify HTTPS certificate auto-provisioned (GitHub does this automatically)
- [ ] Test mobile responsiveness
- [ ] Test all navigation links & sections scroll smoothly

## Post-Deployment

- [ ] Monitor site performance
- [ ] Check GitHub Pages build logs for any errors
- [ ] Add analytics if needed (e.g., Plausible, Google Analytics)
- [ ] Plan product launches & update Products section when ready
