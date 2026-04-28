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
- [ ] Add pawmind as products
- [ ] Change logo
- [ ] Change theme

## Personalization (Make it More Human)

### Phase 1: Meet the Team (High Priority)
- [ ] Add "Meet the Team" section with photos of you and your father
- [ ] Write personal bios: who you are, what drives each of you
- [ ] Share "Why I build" statements from both perspectives
- [ ] Add authentic storytelling about your journey together

### Phase 2: Behind-the-Scenes
- [ ] Add "How We Work" subsection with workspace photos
- [ ] Document your collaboration process (standups, design, code reviews)
- [ ] Share process rituals and team culture
- [ ] Show personality in how you build together

### Phase 3: Product Stories
- [ ] Replace generic product listings with launch stories
- [ ] Document "Why we built this" for each product
- [ ] Add personal testimonials or real use cases
- [ ] Share the journey and decisions behind each product

### Phase 4: Voice & Tone
- [ ] Replace corporate language with personality
- [ ] Use your authentic voice — you're a father & son, not Fortune 500
- [ ] Add casual, conversational language where appropriate

### Phase 5: Connection & Accessibility
- [ ] Add "Let's Talk" / "Get in Touch" section
- [ ] Include personal email or social links
- [ ] Make it clear you're accessible and open to ideas
- [ ] Consider a "Contact Us" form

### Phase 6: Timeline (Optional)
- [ ] Create "Our Story So Far" timeline of key milestones
- [ ] Mark important dates and decisions
- [ ] Humanize the journey with personal moments

### Phase 7: Video Intro (Optional but Powerful)
- [ ] Record short personal video intro (30-60 sec) of you two
- [ ] Discuss why you do this
- [ ] Prioritize authenticity over production quality
