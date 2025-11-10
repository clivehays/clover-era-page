# Clover ERA CRM System

A lightweight, Supabase-powered CRM system built specifically for Clover ERA's sales operations.

## 🚀 Quick Start

**Total setup time: ~15 minutes**

1. **Create Supabase Account**
   - Sign up at [supabase.com](https://supabase.com)
   - Create new project called "Clover-ERA-CRM"

2. **Set Up Database**
   - Copy contents of `supabase-schema.sql`
   - Paste into Supabase SQL Editor
   - Run the script

3. **Configure Credentials**
   - Get your Supabase URL and anon key from Settings → API
   - Update `index.html` and `login.html` with your credentials
   - Search for `YOUR_SUPABASE_URL_HERE` and replace

4. **Deploy**
   ```bash
   git add crm/
   git commit -m "Add Supabase CRM system"
   git push
   ```

5. **Create First User**
   - Go to Supabase → Authentication → Add User
   - Create your admin account
   - Login at `yoursite.com/crm/login.html`

**📖 Full setup guide:** See [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

## 📁 File Structure

```
crm/
├── README.md                   # This file
├── SETUP_GUIDE.md             # Detailed setup instructions
├── supabase-schema.sql        # Database schema (copy to Supabase)
├── index.html                 # Main CRM dashboard
├── login.html                 # Authentication page
├── opportunity.html           # (Coming soon) Opportunity detail view
├── companies.html             # (Coming soon) Companies list
└── activities.html            # (Coming soon) Activities log
```

---

## ✨ Features

### Current Features (v1.0)

✅ **Sales Pipeline Dashboard**
   - Visual pipeline with drag-and-drop stages
   - Real-time opportunity tracking
   - Weighted pipeline calculations

✅ **Key Metrics**
   - Total pipeline value
   - Open opportunities count
   - Weighted forecast
   - Win rate tracking

✅ **Secure Authentication**
   - Email/password login via Supabase Auth
   - Session management
   - Protected routes

✅ **Database Schema**
   - Companies & contacts
   - Opportunities & activities
   - Products & pricing
   - File attachments support

### Coming Soon (v1.1)

🔄 **Opportunity Detail Pages**
   - Full deal information
   - Activity timeline
   - Document attachments
   - Stage progression

🔄 **Company Management**
   - Searchable company list
   - Contact management
   - Company hierarchy

🔄 **Activity Tracking**
   - Call logs
   - Meeting notes
   - Email tracking
   - Task management

---

## 🗄️ Database Schema

### Core Tables

**companies**
- Company information, size, industry
- Status tracking (prospect → customer)
- Annual revenue, employee count

**contacts**
- Contact details linked to companies
- Primary contact designation
- LinkedIn integration

**opportunities**
- Deal pipeline tracking
- Value, stage, probability
- Manager count, MRR, ACV
- Expected close dates

**activities**
- Calls, meetings, demos, notes
- Task management with due dates
- Linked to opportunities/companies

**products**
- Clover ERA offerings ($295/manager/month)
- Pricing and billing periods

### Relationships

```
companies (1) ──→ (many) contacts
companies (1) ──→ (many) opportunities
opportunities (1) ──→ (many) activities
opportunities (many) ←→ (many) products
```

---

## 💰 Cost Breakdown

### Supabase Free Tier (Sufficient for 1-2 years)

| Resource | Free Tier Limit | What This Means |
|----------|----------------|-----------------|
| Database | 500MB | ~10,000+ opportunities |
| Storage | 2GB | Thousands of PDF attachments |
| API Requests | Unlimited | No limits on usage |
| Auth Users | 50,000 MAU | Way more than you'll need |
| Egress | 2GB/month | Sufficient for small team |

### When to Upgrade to Pro ($25/month)

- Database exceeds 500MB (~3-5 years of data)
- Need daily backups with 90-day retention
- Want custom domain
- Need priority support

**Estimated monthly cost:**
- Year 1-2: **$0** (free tier)
- Year 3+: **$25/month** (Pro tier)

---

## 🔒 Security

### Built-in Security Features

✅ **Row Level Security (RLS)**
   - Enabled on all tables
   - Only authenticated users can access data
   - Ready for role-based permissions

✅ **Secure Authentication**
   - Industry-standard JWT tokens
   - Session management
   - Password hashing by Supabase

✅ **HTTPS Everywhere**
   - All API requests over HTTPS
   - Vercel handles SSL certificates

### Best Practices

1. **Never commit Supabase keys to GitHub**
   - Use environment variables in production
   - Current setup is OK for private repo

2. **Use strong passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols

3. **Enable 2FA in Supabase**
   - Protect your admin account
   - Settings → Security → 2FA

4. **Regular backups**
   - Free tier: Daily backups (7-day retention)
   - Pro tier: Daily backups (90-day retention)

---

## 🚢 Deployment

### Current Setup (Vercel)

Your CRM is automatically deployed when you push to GitHub:

```bash
git add crm/
git commit -m "Update CRM"
git push
```

Vercel detects changes and deploys within 1-2 minutes.

**Live URLs:**
- Dashboard: `yoursite.vercel.app/crm/index.html`
- Login: `yoursite.vercel.app/crm/login.html`

### Custom Domain (Optional)

1. Add domain in Vercel dashboard
2. Update DNS records
3. SSL certificates handled automatically

---

## 📊 Sample Data

The schema includes one sample opportunity to test with:

- **Company:** Acme Technology Corp
- **Opportunity:** Manager Enablement Pilot
- **Value:** $35,400 ACV
- **Stage:** Demo Scheduled
- **Managers:** 10

You can delete this after testing or keep it as a template.

---

## 🔗 Integration Opportunities

### Partner Portal Integration

Link the CRM with your existing partner system:

```javascript
// When partner registers opportunity
async function createOpportunityFromPartner(partnerData) {
    const { data, error } = await supabase
        .from('opportunities')
        .insert([{
            title: partnerData.opportunityName,
            stage: 'lead',
            source: 'partner',
            partner_name: partnerData.partnerCompany,
            // ... more fields
        }]);
}
```

### Email Integration

Forward emails to Supabase to auto-log activities:
- Use Supabase Edge Functions
- Parse email content
- Create activity records automatically

### Calendar Sync

Sync meetings to opportunities:
- Google Calendar API
- Automatically create meeting activities
- Set reminders for follow-ups

---

## 🆘 Troubleshooting

### Common Issues

**Can't login**
```
Error: Invalid login credentials
```
Solution: Make sure you checked "Auto Confirm User" when creating the account in Supabase Auth.

**No data showing**
```
Dashboard shows $0 pipeline
```
Solution: Run the schema script again - it includes sample data. Or add opportunities manually in Supabase Table Editor.

**Failed to connect**
```
Error: Failed to fetch
```
Solution: Check that your Supabase URL and anon key are correct in both `index.html` and `login.html`.

### Debug Mode

Check browser console (F12) for detailed error messages. Supabase provides helpful error descriptions.

### Get Help

- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord:** Join for community support
- **GitHub Issues:** Create an issue in this repo

---

## 📈 Roadmap

### Phase 1: Core CRM (Current)
- ✅ Database schema
- ✅ Authentication
- ✅ Dashboard with pipeline view
- ✅ Metrics tracking

### Phase 2: Deal Management (Next)
- 🔄 Opportunity detail pages
- 🔄 Activity logging
- 🔄 Company/contact management
- 🔄 File uploads

### Phase 3: Automation (Future)
- ⏳ Email integration
- ⏳ Calendar sync
- ⏳ Slack notifications
- ⏳ Auto-assignment rules

### Phase 4: Advanced Features (Future)
- ⏳ Reporting & analytics
- ⏳ Forecasting tools
- ⏳ Mobile app (PWA)
- ⏳ AI-powered insights

---

## 📝 License

Internal use only - Clover ERA proprietary system.

---

## 👥 Contributors

Built for Clover ERA by the internal development team.

Questions? Contact: [admin@cloverera.com](mailto:admin@cloverera.com)
