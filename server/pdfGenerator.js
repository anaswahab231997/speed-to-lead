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

      doc.fillColor('rgba(255,255,255,0.4)')
         .font('Helvetica')
         .fontSize(8)
         .text('AUTONOMOUS RECON AGENCY', 380, 56, { align: 'right' });

      // Horizontal Divider
      doc.strokeColor('rgba(255,255,255,0.08)')
         .lineWidth(1)
         .moveTo(50, 85)
         .lineTo(545, 85)
         .stroke();

      // --- TITLE ---
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(22)
         .text('DIGITAL VULNERABILITY AUDIT', 50, 115);

      doc.fillColor('rgba(255,255,255,0.6)')
         .font('Helvetica')
         .fontSize(10)
         .text(`PROSPECT: ${data.name.toUpperCase()}`, 50, 145)
         .text(`WEBSITE: ${data.website}`, 50, 160)
         .text(`AUDIT TIMESTAMP: ${new Date().toISOString()}`, 50, 175);

      // --- MATURITY SCORE WIDGET ---
      doc.roundedRect(50, 205, 495, 80, 12)
         .fill('rgba(18, 18, 18, 0.85)')
         .strokeColor('rgba(255,255,255,0.08)')
         .stroke();

      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('DIGITAL MATURITY SCORE', 70, 222);

      doc.fillColor(data.score <= 3 ? '#ff453a' : '#30d158')
         .font('Helvetica-Bold')
         .fontSize(28)
         .text(`${data.score} / 8`, 70, 240);

      doc.fillColor('rgba(255,255,255,0.5)')
         .font('Helvetica')
         .fontSize(9)
         .text(`PRIORITY LEVEL: ${data.score <= 3 ? 'HIGH PRIORITY OUTREACH' : 'NORMAL'}`, 180, 244);

      doc.text('Scored based on WhatsApp routing, Google reviews, PageSpeed latency, and Instagram activity.', 180, 258, { width: 340 });

      // --- BREAKDOWN SECTION ---
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('VULNERABILITY ASSESSMENT', 50, 310);

      let currentY = 340;
      const items = [
        {
          label: 'WhatsApp Lead Routing',
          status: data.hasWhatsApp ? '🟢 ACTIVE' : '🔴 MISSING',
          points: data.hasWhatsApp ? '+2 pts' : '0 pts (Leak)',
          desc: data.hasWhatsApp ? 'WhatsApp routing is present on the landing page.' : 'No active WhatsApp integration found. Mobile buyers face static forms, creating high drop-off.'
        },
        {
          label: 'Google Reputation Index',
          status: data.reviews > 50 ? '🟢 STRONG' : '🟡 DORMANT',
          points: data.reviews > 50 ? '+2 pts' : '0 pts',
          desc: `Found ${data.reviews} reviews with a rating of ${data.rating}. Reputation index is stable but unmonitored.`
        },
        {
          label: 'PageSpeed Load Latency',
          status: data.pageSpeedScore >= 70 ? '🟢 OPTIMAL' : '🔴 CRITICAL DELAY',
          points: data.pageSpeedScore >= 70 ? '+2 pts' : '0 pts (Leak)',
          desc: `Mobile Performance Score: ${data.pageSpeedScore}%. ${data.pageSpeedScore >= 70 ? 'Optimal server performance.' : 'Extreme loading delays. High bounce rate detected.'}`
        },
        {
          label: 'Social Media Engagement',
          status: data.socialActive ? '🟢 ACTIVE' : '🔴 INACTIVE',
          points: data.socialActive ? '+2 pts' : '0 pts',
          desc: data.socialActive ? 'Instagram account has fresh, active posts.' : 'No active, modern social media conversions found.'
        }
      ];

      items.forEach(item => {
        // Card Background
        doc.roundedRect(50, currentY, 495, 60, 10)
           .fill('rgba(255,255,255,0.02)')
           .strokeColor('rgba(255,255,255,0.04)')
           .stroke();

        doc.fillColor('#ffffff')
           .font('Helvetica-Bold')
           .fontSize(10)
           .text(item.label, 65, currentY + 12);

        doc.fillColor(item.status.includes('🟢') ? '#30d158' : item.status.includes('🟡') ? '#ff9f0a' : '#ff453a')
           .font('Helvetica-Bold')
           .fontSize(9)
           .text(item.status, 350, currentY + 12);

        doc.fillColor('rgba(255,255,255,0.4)')
           .font('Helvetica')
           .fontSize(8)
           .text(item.points, 480, currentY + 12);

        doc.fillColor('rgba(255,255,255,0.65)')
           .font('Helvetica')
           .fontSize(8.5)
           .text(item.desc, 65, currentY + 30, { width: 450 });

        currentY += 72;
      });

      // --- ROI THEOREM ---
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(11)
         .text('THE REVENUE EQUATION', 50, 640);

      doc.roundedRect(50, 660, 495, 90, 12)
         .fill('rgba(10, 132, 255, 0.05)')
         .strokeColor('rgba(10, 132, 255, 0.25)')
         .stroke();

      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('One Sale = 20 Years of Agent OS', 65, 675);

      doc.fillColor('rgba(255,255,255,0.7)')
         .font('Helvetica')
         .fontSize(8.5)
         .text('RMA Motors is letting high-ticket commissions slip through their fingers every hour. Based on an average vehicle value of AED 150,000 and a conservative close rate of 5%, your current digital setup is actively losing high-value buyers. Converting just one additional sale pays for 20 years of your Nexlify Monthly Subscription.', 65, 695, { width: 460, lineGap: 2 });

      // Footer
      doc.fillColor('rgba(255,255,255,0.25)')
         .font('Helvetica')
         .fontSize(8)
         .text('Nexlify Intelligence Report. All rights reserved.', 50, 780, { align: 'center' });

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
