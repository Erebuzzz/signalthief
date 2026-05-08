# SignalThief Deployment Guide

A step-by-step guide for deploying SignalThief as a web application and Chrome extension. Written for beginners — follow each step in order.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option 1: Deploy Web App to Render (Easiest)](#option-1-deploy-web-app-to-render)
- [Option 2: Deploy Web App to Vercel](#option-2-deploy-web-app-to-vercel)
- [Option 3: Deploy Web App with Docker](#option-3-deploy-web-app-with-docker)
- [Option 4: Deploy Web App to a VPS](#option-4-deploy-web-app-to-a-vps)
- [Chrome Extension: Load Unpacked (Development)](#chrome-extension-load-unpacked)
- [Chrome Extension: Package for Distribution](#chrome-extension-package-for-distribution)
- [Chrome Extension: Publish to Chrome Web Store](#chrome-extension-publish-to-chrome-web-store)
- [Environment Variables Reference](#environment-variables-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, make sure you have:

- A [GitHub](https://github.com) account and Git installed
- [Node.js](https://nodejs.org) version 20 or higher installed
- [npm](https://www.npmjs.com) version 9 or higher (comes with Node.js)
- Basic familiarity with the terminal/command line

**Optional but recommended:**
- An account on [Render](https://render.com) (for Render deployment)
- An account on [Vercel](https://vercel.com) (for Vercel deployment)
- [Docker](https://www.docker.com) installed (for Docker deployment)
- A Google Developer account (for Chrome Web Store publishing, $5 one-time fee)

---

## Option 1: Deploy Web App to Render

Render is the simplest option. It auto-detects the `render.yaml` blueprint file and creates your web service automatically. The free tier is enough to get started.

### Step 1: Fork the Repository

1. Go to [https://github.com/Erebuzzz/signalthief](https://github.com/Erebuzzz/signalthief)
2. Click the **Fork** button in the top-right corner
3. This creates a copy of the repository under your GitHub account

### Step 2: Connect Render to GitHub

1. Go to [https://render.com](https://render.com) and sign up (you can use your GitHub account)
2. After signing up, click **New +** → **Web Service**
3. Click **Connect account** next to GitHub
4. Authorize Render to access your repositories
5. Search for `signalthief` and select your forked repository

### Step 3: Deploy

1. Render automatically detects the `render.yaml` file
2. You'll see a pre-configured service named `signalthief-api`
3. Keep all the default settings:
   - **Name:** signalthief-api
   - **Runtime:** Docker
   - **Plan:** Free
   - **Region:** Choose the one closest to you
4. Click **Create Web Service**

### Step 4: Wait for Build

- Render will pull your code, build the Docker image, and start the server
- This takes 3-5 minutes the first time
- You can watch the build logs in real-time on the Render dashboard

### Step 5: Get Your API URL

1. Once the build completes, you'll see a green **"Live"** badge
2. Your API URL will look like: `https://signalthief-api.onrender.com`
3. Copy this URL — you'll need it for the frontend

### Step 6: Deploy the Frontend

The frontend can be deployed separately:

1. Open the `frontend/src/App.tsx` file in your repository
2. Find the line near the top:
   ```ts
   const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
   ```
3. Create a `.env` file in the `frontend/` folder:
   ```
   VITE_API_URL=https://signalthief-api.onrender.com
   ```
   (Replace with your actual Render URL)

4. Deploy the frontend to Vercel (see Option 2) or any static hosting

### Important Notes for Render Free Tier

- Free instances spin down after 15 minutes of inactivity
- The first request after spin-down takes 30-60 seconds (cold start)
- You get 750 hours of runtime per month (enough for one always-on instance)
- Bandwidth is limited to 100GB/month

---

## Option 2: Deploy Web App to Vercel

Vercel is great for the React frontend. The backend still needs to run on Render or another server.

### Step 1: Prepare Your Repository

Make sure your repository is on GitHub (forked or original).

### Step 2: Connect to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up with GitHub
2. Click **Add New** → **Project**
3. Select the `signalthief` repository from the list
4. Click **Import**

### Step 3: Configure the Project

Vercel auto-detects the Vite frontend, but you need to tell it where to find it:

1. **Root Directory:** Click "Edit" and set it to `frontend`
2. **Build Command:** `npm run build` (auto-detected)
3. **Output Directory:** `dist` (auto-detected)
4. **Install Command:** `npm install` (auto-detected)

### Step 4: Set Environment Variables

Under **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your Render backend URL (e.g., `https://signalthief-api.onrender.com`) |

### Step 5: Deploy

1. Click **Deploy**
2. Wait 1-2 minutes for the build to complete
3. Your frontend will be live at `https://signalthief.vercel.app` (or a custom subdomain)

### Step 6: Set Up Custom Domain (Optional)

1. Go to your project settings → **Domains**
2. Add your custom domain (e.g., `signalthief.yourname.com`)
3. Follow Vercel's DNS instructions to point your domain

---

## Option 3: Deploy Web App with Docker

Docker lets you run the entire application locally or on any server that supports containers.

### Step 1: Install Docker

- **Windows/Mac:** Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
- **Linux:** `sudo apt install docker.io docker-compose` (Ubuntu/Debian)

### Step 2: Build and Run Both Services

From the project root folder, run:

```bash
# Build the frontend first
cd frontend
npm install
npm run build
cd ..

# Start both services with Docker Compose
docker-compose up -d
```

This starts:
- **API server** on `http://localhost:3001`
- **Frontend** served via Nginx on `http://localhost:8080`

### Step 3: Verify Everything Works

1. Open `http://localhost:8080` in your browser
2. Enter a test URL and click EXTRACT
3. If extraction works and you can download, everything is set up correctly

### Step 4: Useful Docker Commands

```bash
# Stop all services
docker-compose down

# View logs
docker-compose logs -f api

# Rebuild after code changes
docker-compose build api
docker-compose up -d

# Check service status
docker-compose ps
```

### Deploying Docker to a Cloud Server

If you have a cloud server (AWS EC2, DigitalOcean Droplet, Linode, etc.):

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Install Docker (if not already installed)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Clone your repository
git clone https://github.com/YOUR_USERNAME/signalthief.git
cd signalthief

# 4. Build and run
cd frontend && npm install && npm run build && cd ..
docker-compose up -d

# 5. Check it's running
docker-compose ps
```

Your app will be available at `http://your-server-ip:8080`.

---

## Option 4: Deploy Web App to a VPS

For more control, deploy directly on a VPS (Virtual Private Server) without Docker.

### Step 1: Set Up Your VPS

1. Rent a VPS from DigitalOcean, Linode, Vultr, or AWS EC2
2. Choose Ubuntu 22.04 LTS as the operating system
3. The smallest tier ($5-6/month) is sufficient

### Step 2: SSH into Your Server

```bash
ssh root@your-server-ip
```

### Step 3: Install Prerequisites

```bash
# Update system packages
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install FFmpeg
apt install -y ffmpeg

# Install yt-dlp
apt install -y python3-pip
pip3 install yt-dlp

# Install Nginx (for serving the frontend)
apt install -y nginx

# Install Git
apt install -y git

# Install PM2 (process manager to keep the server running)
npm install -g pm2
```

### Step 4: Clone and Build

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/signalthief.git
cd signalthief

# Install backend dependencies
cd backend
npm install
npm run build
cd ..

# Install and build frontend
cd frontend
npm install
npm run build
cd ..
```

### Step 5: Configure and Start the Backend

```bash
cd backend

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info
CACHE_MAX_AGE=3600000
EOF

# Start with PM2 (auto-restart on crash, start on boot)
pm2 start dist/index.js --name signalthief-api
pm2 save
pm2 startup  # Follow the instructions to enable auto-start on boot
```

### Step 6: Configure Nginx for the Frontend

```bash
# Copy frontend build to Nginx directory
cp -r ../frontend/dist/* /var/www/html/

# Create Nginx config for API proxy
cat > /etc/nginx/sites-available/signalthief << 'EOF'
server {
    listen 80;
    server_name your-domain.com your-server-ip;

    root /var/www/html;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/signalthief /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Remove default config

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Step 7: Set Up Firewall

```bash
# Allow HTTP and SSH traffic
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

### Step 8: (Optional) Set Up HTTPS with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

Your app is now live at `http://your-server-ip` (or your domain). The API is proxied through the same server on port 80, so you don't need to set `VITE_API_URL` separately.

### Managing the Server

```bash
# View backend logs
pm2 logs signalthief-api

# Restart backend
pm2 restart signalthief-api

# Check status
pm2 status

# View Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Update the app
cd /path/to/signalthief
git pull
cd backend && npm install && npm run build && pm2 restart signalthief-api
cd ../frontend && npm install && npm run build && cp -r dist/* /var/www/html/
```

---

## Chrome Extension: Load Unpacked

This is how you install the extension during development (or for personal use).

### Step 1: Open Chrome Extensions Page

1. Open Google Chrome
2. Type `chrome://extensions` in the address bar and press Enter
3. Or go to Menu (three dots) → Extensions → Manage Extensions

### Step 2: Enable Developer Mode

1. Look for the **Developer mode** toggle in the top-right corner
2. Turn it ON

### Step 3: Load the Extension

1. Click the **Load unpacked** button (top-left)
2. Navigate to your `signalthief/extension/` folder on your computer
3. Select the folder and click **Select Folder** (Windows) or **Open** (Mac)

### Step 4: Verify Installation

1. You should see "SignalThief - Audio & Video Downloader" in your extensions list
2. Look for the SignalThief icon in your toolbar (puzzle piece area)
3. Click the puzzle piece and pin SignalThief for easy access

### Step 5: Configure the API URL

By default, the extension connects to `http://localhost:3001`. If you're using a deployed backend:

1. Open `extension/popup/popup.js` in a text editor
2. Find the line:
   ```js
   const API_BASE = 'http://localhost:3001';
   ```
3. Change it to your deployed backend URL:
   ```js
   const API_BASE = 'https://signalthief-api.onrender.com';
   ```
4. Go back to `chrome://extensions` and click the refresh icon on the SignalThief card

### Updating the Extension During Development

After making changes to the extension code:

1. Go to `chrome://extensions`
2. Find SignalThief
3. Click the refresh/reload icon (circular arrow)
4. The extension reloads with your latest changes

---

## Chrome Extension: Package for Distribution

To share the extension without publishing to the Chrome Web Store:

### Step 1: Prepare Icons

The extension manifest references these icon files:
- `extension/icons/icon-16.png` (16x16 pixels)
- `extension/icons/icon-48.png` (48x48 pixels)
- `extension/icons/icon-128.png` (128x128 pixels)

Create these icons. If you don't have design skills:
- Use a tool like [Canva](https://canva.com) or [Figma](https://figma.com)
- The design should be amber (#ff6b00) on dark (#0a0a0a)
- A simple waveform or download arrow icon works great

### Step 2: Package the Extension

1. Go to `chrome://extensions`
2. Make sure Developer mode is ON
3. Click **Pack extension**
4. In **Extension root directory**, browse to your `extension/` folder
5. Leave **Private key file** empty (this is your first time)
6. Click **Pack Extension**

This creates two files next to your `extension/` folder:
- `extension.crx` — the packaged extension file
- `extension.pem` — your private key (**do not share this!**)

### Step 3: Distribute

- Share the `.crx` file with others
- Users can install it by dragging the `.crx` file into `chrome://extensions`
- **Note:** Chrome may warn about unverified extensions. This is normal for manually distributed extensions.

### Step 4: Updating a Packaged Extension

When you make changes:

1. Go to `chrome://extensions` → **Pack extension**
2. For **Extension root directory**, select the updated `extension/` folder
3. **For Private key file, select the `.pem` file** from the first packaging
4. Using the same key means users can update without reinstalling

---

## Chrome Extension: Publish to Chrome Web Store

To make the extension available to everyone through the Chrome Web Store.

### Step 1: Create a Developer Account

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Pay the one-time $5 registration fee
4. Agree to the Developer Agreement

### Step 2: Prepare Your Extension

Before uploading, make sure:

1. **Icons are created** (see Package for Distribution section above)
2. **API URL is correct** in `extension/popup/popup.js` — use your deployed backend URL, not `localhost`
3. **Manifest is correct** — review `extension/manifest.json`:
   - Name and description are accurate
   - Version is set (start with `1.0.0`)
   - All permissions are justified
4. **No sensitive data** in any files (API keys, passwords, etc.)

### Step 3: Create a ZIP File

```bash
# On Windows (PowerShell)
Compress-Archive -Path extension\* -DestinationPath extension.zip

# On Mac/Linux
cd extension
zip -r ../extension.zip . -x "*.pem" "*.crx"
```

### Step 4: Upload to Chrome Web Store

1. Go to the [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **New Item**
3. Upload your `extension.zip` file
4. Wait for the upload to process

### Step 5: Fill in Store Listing

You'll need to provide:

**Required:**
- **Detailed description** — explain what the extension does, what sites it supports
- **Category** — choose "Productivity" or "Social & Communication"
- **Language** — English (or your language)

**Optional but recommended:**
- **Screenshots** (1280x800 or 640x400) — show the popup UI, detected media, download flow
- **Small tile image** (440x280)
- **Promotional images** (1400x560, 920x680, 750x500, 220x140, 128x128, 96x96)

### Step 6: Submit for Review

1. Click **Submit for Review**
2. Fill in the required compliance information:
   - **Privacy practices** — explain what data you collect (SignalThief collects no personal data)
   - **Permissions justification** — explain why each permission is needed:
     - `downloads` — to save downloaded media files
     - `webRequest` — to detect media streams on pages
     - `storage` — to cache extension settings
     - `activeTab` — to detect media on the current tab only
     - `tabs` — to get current tab information
     - `scripting` — to scan pages for media elements
     - `<all_urls>` — to work on all supported websites
3. Submit

### Step 7: Wait for Review

- Review typically takes 1-3 business days
- You'll receive an email when the review is complete
- If rejected, the email will explain what needs to be fixed

### Step 8: After Publication

- Your extension is now live on the Chrome Web Store
- Users can find and install it directly
- **Version updates:** Increment the version in `manifest.json`, re-zip, and upload the new version
- Monitor the Developer Dashboard for user reviews and crash reports

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Port the API server listens on |
| `HOST` | `0.0.0.0` | Host address (use `0.0.0.0` to accept all connections) |
| `NODE_ENV` | `development` | Set to `production` for deployments |
| `LOG_LEVEL` | `info` | Logging level: `debug`, `info`, `warn`, `error` |
| `CACHE_MAX_AGE` | `3600000` | Cache TTL in milliseconds (1 hour) |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001` | Backend API URL (used by the frontend to make requests) |

---

## Troubleshooting

### Backend Issues

| Problem | Solution |
|---------|----------|
| "yt-dlp not found" | Run `pip install yt-dlp` or `pip3 install --break-system-packages yt-dlp` |
| "FFmpeg not found" | Install FFmpeg: `choco install ffmpeg` (Win), `brew install ffmpeg` (Mac), `apt install ffmpeg` (Linux) |
| Port 3001 already in use | Change `PORT` env var, or kill the existing process |
| Build fails | Run `npm install && npm run build` in both `backend/` and `frontend/` folders |
| CORS errors | Make sure your API URL is correct in the frontend config |

### Frontend Issues

| Problem | Solution |
|---------|----------|
| Blank page | Check browser console for errors; verify `npm run build` completed |
| "Network error" on extract | Backend is not running or API URL is wrong |
| Tailwind styles missing | Run `npm install` to ensure all dependencies are installed |

### Docker Issues

| Problem | Solution |
|---------|----------|
| "Cannot connect to Docker daemon" | Start Docker Desktop or Docker service |
| Container exits immediately | Run `docker-compose logs api` to see error messages |
| Port conflicts | Stop other services on ports 3001 or 8080, or change ports in `docker-compose.yml` |

### Extension Issues

| Problem | Solution |
|---------|----------|
| Extension not loading | Make sure the `extension/` folder contains all required files |
| "Manifest is invalid" | Check `manifest.json` for typos; reference only files that exist |
| Extension not detecting media | Refresh the page, then click the refresh button in the popup |
| Downloads not starting | Check that the `downloads` permission is granted |
| API connection refused | Update `API_BASE` in `popup.js` to your deployed backend URL |

---

## Quick Reference: Deployment Options Comparison

| Method | Difficulty | Cost | Best For |
|--------|-----------|------|----------|
| Render (free tier) | Very Easy | Free | Quick deployment, testing, demos |
| Vercel + Render | Easy | Free | Production frontend + free backend |
| Docker | Medium | Free/Server cost | Consistent local/cloud setup |
| VPS | Medium | $5-20/month | Full control, custom domains, production |
| Extension (unpacked) | Very Easy | Free | Personal use, development |
| Extension (Web Store) | Medium | $5 one-time | Public distribution |

---

For questions or issues, open an issue on the [GitHub repository](https://github.com/Erebuzzz/signalthief/issues).