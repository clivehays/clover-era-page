# Self-Hosted TinyMCE Setup Guide

## Why Self-Host?

- ✅ **Free forever** - No subscription needed
- ✅ **No branding** - No "Powered by TinyMCE" message
- ✅ **Works offline** - No internet dependency
- ✅ **Full control** - Your own copy
- ✅ **Privacy** - No external requests

## Installation Steps (5 minutes)

### Step 1: Download TinyMCE

```bash
# Navigate to CRM directory
cd crm

# Install via NPM (recommended)
npm install tinymce

# Or download directly from:
# https://www.tiny.cloud/get-tiny/self-hosted/
```

### Step 2: Copy Files to Public Directory

```bash
# Create js directory if it doesn't exist
mkdir -p public/js

# Copy TinyMCE files
cp -r node_modules/tinymce public/js/tinymce

# Or if using downloaded ZIP:
# unzip tinymce.zip -d public/js/
```

Your structure should look like:
```
crm/
├── public/
│   ├── js/
│   │   └── tinymce/
│   │       ├── tinymce.min.js
│   │       ├── themes/
│   │       ├── plugins/
│   │       └── skins/
│   ├── blog-editor.html
│   └── blog-dashboard.html
```

### Step 3: Update blog-editor.html

Open `crm/public/blog-editor.html` and change line 18:

**Before:**
```html
<!-- TinyMCE from CDN -->
<script src="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>
```

**After:**
```html
<!-- TinyMCE Self-Hosted -->
<script src="/js/tinymce/tinymce.min.js"></script>
```

### Step 4: Configure Express to Serve TinyMCE

Add to your Express server:

```javascript
// Serve TinyMCE static files
app.use('/js/tinymce', express.static(path.join(__dirname, 'public/js/tinymce')));
```

### Step 5: Test

1. Restart your server
2. Navigate to `/backoffice/blog/editor`
3. Verify editor loads correctly
4. Verify no "Powered by TinyMCE" message

## Alternative: CDN with Free API Key

If you prefer CDN delivery (easier updates):

### Step 1: Get Free API Key

1. Visit https://www.tiny.cloud/auth/signup/
2. Sign up (free, no credit card)
3. Verify email
4. Get your API key from dashboard

### Step 2: Update blog-editor.html

Replace line 18:

```html
<script src="https://cdn.tiny.cloud/1/YOUR-API-KEY-HERE/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>
```

### Limits on Free Plan:
- 1,000 editor loads per month
- Perfect for internal CRM use (likely <100 loads/month)
- No branding message

## Comparison

| Feature | Self-Hosted | CDN (no key) | CDN (free key) | Paid ($39/mo) |
|---------|-------------|--------------|----------------|---------------|
| Cost | Free | Free | Free | $468/year |
| Branding | None | "Powered by" | None | None |
| Editor loads | Unlimited | Unlimited | 1,000/month | Unlimited |
| Internet required | No | Yes | Yes | Yes |
| Auto-updates | Manual | Yes | Yes | Yes |
| Setup time | 5 min | 0 min | 2 min | 2 min |

## Recommendation

**For Clover ERA CRM:**

Use **self-hosted** because:
- Internal tool (not public-facing)
- Low monthly usage (<100 editor sessions)
- No branding needed
- Privacy/security (no external dependencies)
- One-time 5-minute setup

**When to use CDN:**
- If you want automatic updates
- If 5-minute setup is too much effort
- If you're already using Tiny.cloud for other projects

## Troubleshooting

### Editor not loading?

**Check browser console** for errors:

1. Press F12 → Console tab
2. Look for error messages

**Common issues:**

**Error:** `Failed to load resource: net::ERR_FILE_NOT_FOUND`
- **Fix:** Verify file path is correct: `/js/tinymce/tinymce.min.js`
- **Fix:** Ensure Express static middleware configured

**Error:** `tinymce is not defined`
- **Fix:** Script tag needs to load before `tinymce.init()`
- **Fix:** Remove `defer` or `async` from script tag

**Error:** `Could not find theme/plugin`
- **Fix:** Ensure full TinyMCE directory copied (themes, plugins, skins)
- **Fix:** Don't just copy tinymce.min.js - need entire folder

### Plugins not working?

Verify these folders exist in `public/js/tinymce/`:
- `themes/`
- `plugins/`
- `skins/`
- `icons/`

### Styles broken?

TinyMCE needs skin files. Verify:
```
public/js/tinymce/skins/ui/oxide/
```

## Updates

### Self-Hosted Updates

Every 3-6 months, update TinyMCE:

```bash
cd crm
npm update tinymce
cp -r node_modules/tinymce public/js/tinymce
```

Test in development before deploying to production.

## Support

- TinyMCE Docs: https://www.tiny.cloud/docs/
- GitHub: https://github.com/tinymce/tinymce
- Community: https://community.tiny.cloud/

## Summary

**Quick Setup:**
```bash
cd crm
npm install tinymce
cp -r node_modules/tinymce public/js/tinymce
```

**Update blog-editor.html line 18:**
```html
<script src="/js/tinymce/tinymce.min.js"></script>
```

**Done!** No branding, no costs, no internet dependency.
