#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// City data from customization guide
const cities = {
  birmingham: {
    name: 'Birmingham',
    region: 'England',
    title: 'Employee Engagement Solutions Birmingham | Clover Era',
    description: 'Transform your Birmingham workplace with neuroscience-backed employee engagement strategies. Reduce burnout, boost productivity in manufacturing, automotive, and professional services.',
    heroContext: "Birmingham's diverse economy, from advanced manufacturing in the automotive sector to growing professional services and FinTech clusters, creates unique workplace challenges. From Digbeth's creative industries to the Jewellery Quarter's heritage businesses, employee burnout and disengagement affect organizations of all sizes.",
    industries: ['Advanced Manufacturing', 'Automotive', 'Professional Services', 'FinTech', 'Creative Industries'],
    whyMatters: "With Birmingham's position as the UK's second-largest economy and ongoing regeneration projects attracting new talent, retaining and engaging employees is more critical than ever."
  },
  manchester: {
    name: 'Manchester',
    region: 'England',
    title: 'Employee Engagement Solutions Manchester | Clover Era',
    description: 'Transform your Manchester workplace with neuroscience-backed employee engagement strategies. Reduce burnout in tech, media, and professional services sectors.',
    heroContext: "Manchester's thriving tech and digital scene, from MediaCityUK to the city's expanding startup ecosystem, creates unique workplace challenges. From financial services in Spinningfields to creative agencies in the Northern Quarter, employee burnout and disengagement affect organizations of all sizes.",
    industries: ['Technology & Digital', 'Media & Broadcasting', 'Financial Services', 'Creative & Marketing Agencies', 'Professional Services'],
    whyMatters: "With Manchester's rapid growth as a tech hub and intense competition for digital talent, retaining and engaging employees is more critical than ever."
  },
  dublin: {
    name: 'Dublin',
    region: 'Ireland',
    title: 'Employee Engagement Solutions Dublin | Clover Era',
    description: 'Transform your Dublin workplace with neuroscience-backed employee engagement strategies. Reduce burnout in tech, pharma, and financial services.',
    heroContext: "Dublin's position as a European tech hub, hosting headquarters for major multinationals alongside pharmaceutical and financial services sectors, creates unique workplace challenges. From the Silicon Docks to the IFSC, employee burnout and disengagement affect organizations of all sizes.",
    industries: ['Technology & Software', 'Pharmaceutical & Life Sciences', 'Financial Services', 'Professional Services', 'E-commerce'],
    whyMatters: "With Dublin's intense competition for talent among multinational tech companies and rising cost of living, retaining and engaging employees is more critical than ever."
  },
  leeds: {
    name: 'Leeds',
    region: 'England',
    title: 'Employee Engagement Solutions Leeds | Clover Era',
    description: 'Transform your Leeds workplace with neuroscience-backed employee engagement strategies. Reduce burnout in financial services, legal, and healthcare sectors.',
    heroContext: "Leeds' strong financial and professional services sector, combined with major healthcare and retail operations, creates unique workplace challenges. From financial services in the city centre to growing tech startups, employee burnout and disengagement affect organizations of all sizes.",
    industries: ['Financial Services', 'Legal Services', 'Healthcare', 'Retail & E-commerce', 'Digital & Tech'],
    whyMatters: "With Leeds' position as the UK's third-largest financial centre and strong professional services sector, retaining and engaging employees is more critical than ever."
  },
  glasgow: {
    name: 'Glasgow',
    region: 'Scotland',
    title: 'Employee Engagement Solutions Glasgow | Clover Era',
    description: 'Transform your Glasgow workplace with neuroscience-backed employee engagement strategies. Reduce burnout in financial services, manufacturing, and creative industries.',
    heroContext: "Glasgow's diverse economy, from financial services and manufacturing to a thriving creative and life sciences sector, creates unique workplace challenges. From shipbuilding heritage to modern tech startups, employee burnout and disengagement affect organizations of all sizes.",
    industries: ['Financial Services', 'Manufacturing & Engineering', 'Creative Industries', 'Life Sciences', 'Professional Services'],
    whyMatters: "With Glasgow's transformation into a modern service economy and growing startup ecosystem, retaining and engaging employees is more critical than ever."
  },
  liverpool: {
    name: 'Liverpool',
    region: 'England',
    title: 'Employee Engagement Solutions Liverpool | Clover Era',
    description: 'Transform your Liverpool workplace with neuroscience-backed employee engagement strategies. Reduce burnout in logistics, retail, and professional services.',
    heroContext: "Liverpool's position as a major port city, combined with growing digital and creative sectors, creates unique workplace challenges. From logistics and maritime industries to the Baltic Triangle's tech startups, employee burnout and disengagement affect organizations of all sizes.",
    industries: ['Logistics & Maritime', 'Retail', 'Digital & Tech', 'Creative Industries', 'Tourism & Hospitality'],
    whyMatters: "With Liverpool's evolving economy and significant investment in digital infrastructure, retaining and engaging employees is more critical than ever."
  },
  newcastle: {
    name: 'Newcastle',
    region: 'England',
    title: 'Employee Engagement Solutions Newcastle | Clover Era',
    description: 'Transform your Newcastle workplace with neuroscience-backed employee engagement strategies. Reduce burnout in professional services, healthcare, and tech sectors.',
    heroContext: "Newcastle's growing reputation as a business and innovation hub, from financial services to the expanding digital sector, creates unique workplace challenges. From professional services in the city centre to tech companies in the Science Central development, employee burnout and disengagement affect organizations of all sizes.",
    industries: ['Professional Services', 'Healthcare & Life Sciences', 'Technology & Digital', 'Financial Services', 'Education & Research'],
    whyMatters: "With Newcastle's transformation into a knowledge economy and competitive cost base attracting new businesses, retaining and engaging employees is more critical than ever."
  },
  sheffield: {
    name: 'Sheffield',
    region: 'England',
    title: 'Employee Engagement Solutions Sheffield | Clover Era',
    description: 'Transform your Sheffield workplace with neuroscience-backed employee engagement strategies. Reduce burnout in manufacturing, healthcare, and creative sectors.',
    heroContext: "Sheffield's heritage in advanced manufacturing, combined with growing healthcare, digital, and creative sectors, creates unique workplace challenges. From precision engineering to the Digital Campus, employee burnout and disengagement affect organizations of all sizes.",
    industries: ['Advanced Manufacturing', 'Healthcare', 'Digital & Tech', 'Creative Industries', 'Professional Services'],
    whyMatters: "With Sheffield's evolution from industrial heritage to a modern innovation economy, retaining and engaging employees is more critical than ever."
  },
  bristol: {
    name: 'Bristol',
    region: 'England',
    title: 'Employee Engagement Solutions Bristol | Clover Era',
    description: 'Transform your Bristol workplace with neuroscience-backed employee engagement strategies. Reduce burnout in aerospace, tech, and creative industries.',
    heroContext: "Bristol's diverse economy, from aerospace and defence to thriving tech and creative sectors, creates unique workplace challenges. From Filton's aerospace cluster to the Temple Quarter's digital startups, employee burnout and disengagement affect organizations of all sizes.",
    industries: ['Aerospace & Defence', 'Technology & Digital', 'Creative & Media', 'Financial Services', 'Professional Services'],
    whyMatters: "With Bristol's strong innovation ecosystem and competition for technical talent, retaining and engaging employees is more critical than ever."
  },
  belfast: {
    name: 'Belfast',
    region: 'Northern Ireland',
    title: 'Employee Engagement Solutions Belfast | Clover Era',
    description: 'Transform your Belfast workplace with neuroscience-backed employee engagement strategies. Reduce burnout in tech, aerospace, and financial services.',
    heroContext: "Belfast's growing reputation as a tech and innovation hub, combined with established aerospace and financial services sectors, creates unique workplace challenges. From cybersecurity companies to fintech startups in the Catalyst Quarter, employee burnout and disengagement affect organizations of all sizes.",
    industries: ['Technology & Cybersecurity', 'Aerospace & Engineering', 'Financial Services', 'Professional Services', 'Creative Industries'],
    whyMatters: "With Belfast's rapid growth in tech investment and competitive talent costs, retaining and engaging employees is more critical than ever."
  },
  leicester: {
    name: 'Leicester',
    region: 'England',
    title: 'Employee Engagement Solutions Leicester | Clover Era',
    description: 'Transform your Leicester workplace with neuroscience-backed employee engagement strategies. Reduce burnout in manufacturing, logistics, and retail sectors.',
    heroContext: "Leicester's diverse economy, from textile manufacturing and logistics to growing tech and life sciences sectors, creates unique workplace challenges. From distribution centres to innovation hubs, employee burnout and disengagement affect organizations of all sizes.",
    industries: ['Manufacturing', 'Logistics & Distribution', 'Retail', 'Healthcare & Life Sciences', 'Professional Services'],
    whyMatters: "With Leicester's strategic location and growing investment in infrastructure, retaining and engaging employees is more critical than ever."
  },
  edinburgh: {
    name: 'Edinburgh',
    region: 'Scotland',
    title: 'Employee Engagement Solutions Edinburgh | Clover Era',
    description: 'Transform your Edinburgh workplace with neuroscience-backed employee engagement strategies. Reduce burnout in financial services, tech, and tourism sectors.',
    heroContext: "Edinburgh's position as Scotland's financial capital, combined with thriving tech, tourism, and public sectors, creates unique workplace challenges. From financial services in the Exchange to tech companies in the Quartermile, employee burnout and disengagement affect organizations of all sizes.",
    industries: ['Financial Services', 'Technology & Digital', 'Tourism & Hospitality', 'Professional Services', 'Public Sector'],
    whyMatters: "With Edinburgh's competitive talent market and status as a European financial hub, retaining and engaging employees is more critical than ever."
  },
  nottingham: {
    name: 'Nottingham',
    region: 'England',
    title: 'Employee Engagement Solutions Nottingham | Clover Era',
    description: 'Transform your Nottingham workplace with neuroscience-backed employee engagement strategies. Reduce burnout in manufacturing, retail, and life sciences.',
    heroContext: "Nottingham's diverse economy, from pharmaceutical and life sciences to retail and professional services, creates unique workplace challenges. From BioCity's life sciences cluster to growing creative industries, employee burnout and disengagement affect organizations of all sizes.",
    industries: ['Life Sciences & Pharmaceuticals', 'Manufacturing', 'Retail', 'Professional Services', 'Creative Industries'],
    whyMatters: "With Nottingham's strong life sciences sector and central location attracting businesses, retaining and engaging employees is more critical than ever."
  },
  cardiff: {
    name: 'Cardiff',
    region: 'Wales',
    title: 'Employee Engagement Solutions Cardiff | Clover Era',
    description: 'Transform your Cardiff workplace with neuroscience-backed employee engagement strategies. Reduce burnout in professional services, media, and public sector.',
    heroContext: "Cardiff's role as Wales' capital, with strong professional services, media, and public sectors, creates unique workplace challenges. From financial services in the city centre to media companies in Cardiff Bay, employee burnout and disengagement affect organizations of all sizes.",
    industries: ['Professional Services', 'Financial Services', 'Media & Broadcasting', 'Public Sector', 'Technology & Digital'],
    whyMatters: "With Cardiff's growing reputation as a business destination and attractive cost base, retaining and engaging employees is more critical than ever."
  }
};

// Read London template
const londonTemplate = fs.readFileSync(path.join(__dirname, 'locations/london/index.html'), 'utf8');

// Generate page for each city
Object.entries(cities).forEach(([slug, data]) => {
  let html = londonTemplate;

  // Replace all London-specific content
  html = html.replace(/London/g, data.name);
  html = html.replace(/Employee Engagement Solutions in London/g, `Employee Engagement Solutions in ${data.name}`);
  html = html.replace(/<title>.*?<\/title>/, `<title>${data.title}</title>`);
  html = html.replace(/<meta name="description" content=".*?"/, `<meta name="description" content="${data.description}"`);
  html = html.replace(/https:\/\/cloverera\.com\/locations\/london\//g, `https://cloverera.com/locations/${slug}/`);
  html = html.replace(/"name": "Clover Era - London"/, `"name": "Clover Era - ${data.name}"`);
  html = html.replace(/"name": "London"/, `"name": "${data.name}"`);
  html = html.replace(/\/locations\/ \/ London/, `/locations/ / ${data.name}`);
  html = html.replace(/<meta property="og:title" content=".*?"/, `<meta property="og:title" content="${data.title}"`);
  html = html.replace(/<meta property="og:description" content=".*?"/, `<meta property="og:description" content="${data.description}"`);

  // Replace hero context (the "Why London Businesses Choose" paragraph)
  html = html.replace(/London's fast-paced business environment.*?high-performing cultures\./s, data.heroContext + '\n            <p>Our neuroscience-backed CLOVER Framework addresses the root causes of workplace stress, helping ' + data.name + ' businesses create sustainable, high-performing cultures.</p>');

  // Replace industries list
  const industriesList = data.industries.map(industry => `                <li>${industry}</li>`).join('\n');
  html = html.replace(/<ul style="font-size: 1\.125rem.*?<\/ul>/s, `<ul style="font-size: 1.125rem; line-height: 2; color: var(--warm-gray); margin-left: 2rem;">\n${industriesList}\n            </ul>`);

  // Replace "Why Employee Engagement Matters" section
  html = html.replace(/With London's competitive talent market.*?boosting productivity by up to 40%\./s, data.whyMatters + '\n            <p>Our neuroscience-backed approach helps ' + data.name + ' companies create workplaces where employees thrive, reducing turnover costs and boosting productivity by up to 40%.</p>');

  // Replace section titles
  html = html.replace(/Why London Businesses Choose Clover Era/g, `Why ${data.name} Businesses Choose Clover Era`);
  html = html.replace(/Serving All London Sectors/g, `Serving All ${data.name} Sectors`);
  html = html.replace(/Why Employee Engagement Matters in London/g, `Why Employee Engagement Matters in ${data.name}`);
  html = html.replace(/Transform your London workplace/g, `Transform your ${data.name} workplace`);
  html = html.replace(/Ready to Transform Your London Workplace\?/g, `Ready to Transform Your ${data.name} Workplace?`);

  // Write file
  const outputPath = path.join(__dirname, `locations/${slug}/index.html`);
  fs.writeFileSync(outputPath, html);
  console.log(`✅ Created ${slug}/index.html`);
});

console.log(`\n🎉 Successfully created ${Object.keys(cities).length} city pages!`);
