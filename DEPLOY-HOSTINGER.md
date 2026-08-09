# PeerScholars — Deploy to Hostinger (peerscholars.com)

## Sign-up emails
Submissions from `signup.html` are sent to **support@peerscholars.com** via [FormSubmit](https://formsubmit.co).

**Important:** After the first form submission, FormSubmit sends an activation email to `support@peerscholars.com`. Click the link in that email once to activate delivery.

## Option A — Upload files in Hostinger hPanel (fastest)

1. Log in to [Hostinger hPanel](https://hpanel.hostinger.com).
2. Open **Websites** → **peerscholars.com** → **File Manager**.
3. Open the `public_html` folder (this is your live site root).
4. Delete any default Hostinger placeholder files (`index.php`, etc.) if present.
5. Upload **all files and folders** from this project:
   - All `.html` files
   - `css/`, `js/`, `images/` folders
6. Ensure `index.html` is directly inside `public_html`.
7. Visit https://peerscholars.com and test Sign Up.

## Option B — Deploy from GitHub

1. Push this repo to https://github.com/srihari-cit/PeerScholars
2. In hPanel → **Advanced** → **Git** (if available on your plan):
   - Connect the GitHub repo
   - Set deploy path to `public_html`
   - Deploy the `main` branch
3. Or clone locally on your machine and FTP upload the contents of the repo to `public_html`.

## Domain
In hPanel → **Domains**, confirm **peerscholars.com** points to this hosting account. DNS may take up to 24 hours after changes.

## Email inbox (support@peerscholars.com)
Create the mailbox in hPanel → **Emails** → create `support@peerscholars.com` so you can receive sign-ups and FormSubmit activation.

## Test after deploy
1. Open https://peerscholars.com/signup.html
2. Submit a test parent and tutor sign-up
3. Check `support@peerscholars.com` inbox (and spam folder)
