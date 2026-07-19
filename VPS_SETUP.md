# Nami Portfolio — Windows VPS Setup Guide

## Step 1 — Enable IIS (one-time)

Open **PowerShell as Administrator** and run:

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-StaticContent, IIS-DefaultDocument, IIS-HttpCompressionStatic -All
```

Or via GUI: **Server Manager → Add Roles and Features → Web Server (IIS)**

---

## Step 2 — Deploy Your Files

Copy your entire project folder to:
```
C:\inetpub\wwwroot\nami\
```

Your folder should look like:
```
C:\inetpub\wwwroot\nami\
    index.html
    mobile.html
    manifest.json
    sw.js
    web.config
    app.js
    utils.js
    loader.js
    data.js
    data_health.js
    component_in.js
    component_sg.js
    health.js
    main.css
    mobile.css
    avatar_self.png
    avatar_wife.png
    avatar_daughter.png
    avatar_family.png
    assets/
        logo/
            logo_AIA.png
            logo_Prudential.png
            ... (all logos)
```

---

## Step 3 — Access the Site

Open a browser on any device on any network:
```
http://YOUR_VPS_IP/nami/
http://YOUR_VPS_IP/nami/mobile.html    ← Mobile version
```

To find your VPS IP: open CMD and run `ipconfig` — look for IPv4 Address.

---

## Step 4 — Free Domain Name (Optional)

### Option A: DuckDNS (simplest)
1. Go to **duckdns.org** and sign in with Google
2. Create a subdomain, e.g. `nami-portfolio.duckdns.org`
3. Enter your VPS IP address
4. Access your site at: `http://nami-portfolio.duckdns.org/nami/`

To keep the IP updated automatically, create a Windows Scheduled Task:
```
URL: https://www.duckdns.org/update?domains=YOUR_DOMAIN&token=YOUR_TOKEN&ip=
Run: Every 5 minutes
```

### Option B: GitHub Pages (no VPS needed!)
Since your repo is already on GitHub:
1. Go to repo **Settings → Pages**
2. Source: Deploy from branch → main → / (root)
3. Your site goes live at: `https://sananpah.github.io/my-policies/`
4. Mobile version at: `https://sananpah.github.io/my-policies/mobile.html`

**This is the easiest option — no VPS config needed at all.**

---

## Step 5 — Free HTTPS on IIS (Optional but recommended)

Install **win-acme** (free Let's Encrypt client for Windows IIS):

1. Download from: https://www.win-acme.com/
2. Run `wacs.exe` as Administrator
3. Choose your site → it automatically gets and renews SSL certs
4. Your site becomes: `https://nami-portfolio.duckdns.org/nami/`

---

## Step 6 — Install as Phone App (PWA)

Once your site is live:

### iPhone (Safari)
1. Open `http://YOUR_VPS_IP/nami/mobile.html` in Safari
2. Tap **Share** (box with arrow) → **Add to Home Screen**
3. Tap **Add** — it appears as a full-screen app icon

### Android (Chrome)
1. Open the URL in Chrome
2. Tap **⋮ menu → Add to Home screen**
3. Or Chrome shows a banner automatically — tap **Install**

The app works **offline** after first load (service worker caches everything).

---

## Firewall — Allow Port 80

If the site isn't accessible from outside, open port 80 in Windows Firewall:

```powershell
New-NetFirewallRule -DisplayName "HTTP Inbound" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

And in your VPS provider's control panel, allow port 80 in the security group / inbound rules.
