const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateVulnerabilityPDF(data, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Nexlify Digital Audit - ${data.name}`,
          Author: 'Nexlify Intelligence Engine',
          Subject: 'Digital Vulnerability and Revenue Recovery Audit'
        }
      });

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // --- LUXURY DESIGN ETHOS (THE DARK ROOM) ---
      // Obsidian Background
      doc.rect(0, 0, 595.28, 841.89).fill('#020202');

      // --- HEADER ---
      doc.fillColor('#0a84ff');
      doc.circle(50, 60, 6).fill();

      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(16)
         .text('NEXLIFY', 66, 52, { characterSpacing: 2 });

      doc.fillColor('#ffffff').fillOpacity(0.4)
         .font('Helvetica')
         .fontSize(8)
         .text('AUTONOMOUS RECON AGENCY', 380, 56, { align: 'right' });
      doc.fillOpacity(1); // Reset opacity

      // Horizontal Divider
      doc.strokeColor('#ffffff').strokeOpacity(0.08)
         .lineWidth(1)
         .moveTo(50, 85)
         .lineTo(545, 85)
         .stroke();
      doc.strokeOpacity(1); // Reset opacity

      // --- TITLE ---
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(22)
         .text('DIGITAL VULNERABILITY AUDIT', 50, 115);

      doc.fillColor('#ffffff').fillOpacity(0.6)
         .font('Helvetica')
         .fontSize(10)
         .text(`PROSPECT: ${data.name.toUpperCase()}`, 50, 145)
         .text(`WEBSITE: ${data.website}`, 50, 160)
         .text(`AUDIT TIMESTAMP: ${new Date().toISOString()}`, 50, 175);
      doc.fillOpacity(1);

      // --- MATURITY SCORE WIDGET ---
      doc.roundedRect(50, 205, 495, 80, 12)
         .fillColor('#121212').fillOpacity(0.85)
         .fill()
         .strokeColor('#ffffff').strokeOpacity(0.08)
         .stroke();
      doc.fillOpacity(1).strokeOpacity(1);

      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('DIGITAL MATURITY SCORE', 70, 222);

      doc.fillColor(data.score <= 3 ? '#ff453a' : '#30d158')
         .font('Helvetica-Bold')
         .fontSize(28)
         .text(`${data.score} / 8`, 70, 240);

      doc.fillColor('#ffffff').fillOpacity(0.5)
         .font('Helvetica')
         .fontSize(9)
         .text(`PRIORITY LEVEL: ${data.score <= 3 ? 'HIGH PRIORITY OUTREACH' : 'NORMAL'}`, 180, 244);
      doc.fillOpacity(1);

      doc.fillColor('#ffffff').fillOpacity(0.5)
         .text('Scored based on WhatsApp routing, Google reviews, PageSpeed latency, and Instagram activity.', 180, 258, { width: 340 });
      doc.fillOpacity(1);

      // --- BREAKDOWN SECTION ---
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('VULNERABILITY ASSESSMENT', 50, 310);

      let currentY = 340;
      const items = [
        {
          label: 'WhatsApp Lead Routing',
          status: data.hasWhatsApp ? 'ACTIVE' : 'MISSING',
          isGood: data.hasWhatsApp,
          points: data.hasWhatsApp ? '+2 pts' : '0 pts (Leak)',
          desc: data.hasWhatsApp ? 'WhatsApp routing is present on the landing page.' : 'No active WhatsApp integration found. Mobile buyers face static forms, creating high drop-off.'
        },
        {
          label: 'Google Reputation Index',
          status: data.reviews > 50 ? 'STRONG' : 'DORMANT',
          isGood: data.reviews > 50,
          points: data.reviews > 50 ? '+2 pts' : '0 pts',
          desc: `Found ${data.reviews || 0} reviews with a rating of ${data.rating || 'N/A'}. Reputation index is monitored.`
        },
        {
          label: 'PageSpeed Load Latency',
          status: data.pageSpeedScore >= 70 ? 'OPTIMAL' : 'CRITICAL DELAY',
          isGood: data.pageSpeedScore >= 70,
          points: data.pageSpeedScore >= 70 ? '+2 pts' : '0 pts (Leak)',
          desc: `Mobile Performance Score: ${data.pageSpeedScore || 0}%. ${data.pageSpeedScore >= 70 ? 'Optimal server performance.' : 'Extreme loading delays. High bounce rate detected.'}`
        },
        {
          label: 'Social Media Engagement',
          status: data.socialActive ? 'ACTIVE' : 'INACTIVE',
          isGood: data.socialActive,
          points: data.socialActive ? '+2 pts' : '0 pts',
          desc: data.socialActive ? 'Instagram account has fresh, active posts.' : 'No active, modern social media conversions found.'
        }
      ];

      items.forEach(item => {
        // Card Background
        doc.roundedRect(50, currentY, 495, 60, 10)
           .fillColor('#ffffff').fillOpacity(0.02)
           .fill()
           .strokeColor('#ffffff').strokeOpacity(0.04)
           .stroke();
        doc.fillOpacity(1).strokeOpacity(1);

        // Status Indicator Circle
        doc.fillColor(item.isGood ? '#30d158' : item.label === 'Google Reputation Index' && !item.isGood ? '#ff9f0a' : '#ff453a');
        doc.circle(65, currentY + 18, 4).fill();

        doc.fillColor('#ffffff')
           .font('Helvetica-Bold')
           .fontSize(10)
           .text(item.label, 75, currentY + 12);

        doc.fillColor(item.isGood ? '#30d158' : item.label === 'Google Reputation Index' && !item.isGood ? '#ff9f0a' : '#ff453a')
           .font('Helvetica-Bold')
           .fontSize(9)
           .text(item.status, 350, currentY + 12);

        doc.fillColor('#ffffff').fillOpacity(0.4)
           .font('Helvetica')
           .fontSize(8)
           .text(item.points, 480, currentY + 12);
        doc.fillOpacity(1);

        doc.fillColor('#ffffff').fillOpacity(0.65)
           .font('Helvetica')
           .fontSize(8.5)
           .text(item.desc, 75, currentY + 30, { width: 440 });
        doc.fillOpacity(1);

        currentY += 72;
      });

      // --- ROI THEOREM ---
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(11)
         .text('THE REVENUE EQUATION', 50, 640);

      doc.roundedRect(50, 660, 495, 90, 12)
         .fillColor('#0a84ff').fillOpacity(0.05)
         .fill()
         .strokeColor('#0a84ff').strokeOpacity(0.25)
         .stroke();
      doc.fillOpacity(1).strokeOpacity(1);

      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('One Sale = 20 Years of Agent OS', 65, 675);

      doc.fillColor('#ffffff').fillOpacity(0.7)
         .font('Helvetica')
         .fontSize(8.5)
         .text(`${data.name} is letting high-ticket commissions slip through their fingers every hour. Based on an average vehicle value of AED 150,000 and a conservative close rate of 5%, your current digital setup is actively losing high-value buyers. Converting just one additional sale pays for 20 years of your Nexlify Monthly Subscription.`, 65, 695, { width: 460, lineGap: 2 });
      doc.fillOpacity(1);

      // --- PAGE 2: THE SPEED TO LEAD SOLUTION ---
      doc.addPage();
      doc.rect(0, 0, 595.28, 841.89).fill('#020202');

      doc.fillColor('#ff453a')
         .font('Helvetica-Bold')
         .fontSize(24)
         .text('SPEED TO LEAD™', 50, 60);
      
      doc.fillColor('#ffffff')
         .fontSize(14)
         .text('The Autonomy Layer for Luxury Showrooms', 50, 95);

      doc.strokeColor('#ffffff').strokeOpacity(0.1)
         .moveTo(50, 125).lineTo(545, 125).stroke();
      doc.strokeOpacity(1);

      const features = [
        {
          title: '24/7 Autonomous Closer (Layla)',
          desc: 'Our flagship AI Closer engages every lead across WhatsApp, Web, and Social in 4 seconds. She qualifies, overcomes objections, and schedules viewings while your team sleeps.'
        },
        {
          title: 'The Sentinel Dashboard',
          desc: 'A high-status command center for management. Real-time telemetry on revenue-at-risk, agent response times, and sales pipeline velocity.'
        },
        {
          title: 'Zero-Friction WhatsApp Capture',
          desc: 'Replace static forms with our premium WhatsApp trigger. 85% higher conversion rate by meeting luxury buyers where they are most comfortable.'
        },
        {
          title: 'Competitive Recon Swarm',
          desc: 'Our intelligence agents continuously monitor regional pricing and inventory trends, keeping your dealership ahead of the market in real-time.'
        }
      ];

      let featY = 160;
      features.forEach(f => {
        doc.fillColor('#ff453a').circle(60, featY + 10, 4).fill();
        
        doc.fillColor('#ffffff')
           .font('Helvetica-Bold')
           .fontSize(12)
           .text(f.title, 80, featY);
        
        doc.fillColor('#ffffff').fillOpacity(0.6)
           .font('Helvetica')
           .fontSize(10)
           .text(f.desc, 80, featY + 20, { width: 450, lineGap: 3 });
        doc.fillOpacity(1);
        
        featY += 80;
      });

      doc.roundedRect(50, 520, 495, 120, 15)
         .fillColor('#ffffff').fillOpacity(0.03)
         .fill()
         .strokeColor('#ff453a').strokeOpacity(0.3)
         .stroke();
      doc.fillOpacity(1).strokeOpacity(1);

      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(13)
         .text('EXCLUSIVE INVITATION', 75, 545);

      doc.fillColor('#ffffff').fillOpacity(0.7)
         .font('Helvetica')
         .fontSize(11)
         .text('Your dealership has been flagged as a high-recovery candidate. We invite you to activate your private Speed to Lead node and stop the revenue leak today.', 75, 570, { width: 440, lineGap: 3 });
      doc.fillOpacity(1);

      doc.fillColor('#ff453a')
         .font('Helvetica-Bold')
         .fontSize(11)
         .text('ACTIVATE AT: ainexlifyagencies.com/ignite', 75, 615);

      // Footer
      doc.fillColor('#ffffff').fillOpacity(0.25)
         .font('Helvetica')
         .fontSize(8)
         .text('Speed to Lead™ is a proprietary technology of Nexlify AI Agencies.', 50, 780, { align: 'center' });
      doc.fillOpacity(1);

      doc.end();

      stream.on('finish', () => {
        console.log(`[PDF] Report generated at ${outputPath}`);
        resolve();
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateVulnerabilityPDF };

