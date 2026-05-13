export const mockLeads = [
  {
    id: 'L001', name: 'Ahmed Al Mansouri', phone: '+971 50 234 5678',
    car: '2021 Toyota Land Cruiser GXR', budget: 'AED 185,000',
    score: 9, status: 'active', time: '2m ago', city: 'Dubai',
    messages: [
      { sender: 'buyer', text: 'Hi, is the Land Cruiser still available?', time: '10:42 AM' },
      { sender: 'layla', text: "Hi Ahmed! Yes, the 2021 Land Cruiser GXR is available. It's in excellent condition — 42,000km, single owner, full service history. Would you like to know more about the specs or arrange a viewing? 😊", time: '10:42 AM' },
      { sender: 'buyer', text: "What's the best price? I've seen similar for 175k", time: '10:44 AM' },
      { sender: 'layla', text: "Great eye, Ahmed! That price point is for the GX trim. This GXR has the premium leather, 360 camera, and 4-zone climate — it's a significantly higher spec. Our price is AED 185,000. However, I can check if there's any flexibility for a serious buyer. Are you looking to purchase within the next 7 days?", time: '10:44 AM' },
      { sender: 'buyer', text: 'Yes definitely this week. Can I test drive tomorrow?', time: '10:46 AM' },
      { sender: 'layla', text: "Absolutely! I'm booking you in for tomorrow. What time works — morning (10am–12pm) or afternoon (3pm–6pm)? Our showroom is in Al Quoz, Dubai. I'll send the exact location and confirmation to this number. 🚗", time: '10:46 AM' },
    ]
  },
  {
    id: 'L002', name: 'Sara Khalil', phone: '+971 55 876 3421',
    car: '2022 Nissan Patrol Platinum', budget: 'AED 210,000',
    score: 7, status: 'active', time: '18m ago', city: 'Abu Dhabi',
    messages: [
      { sender: 'buyer', text: 'Hello, I want to know about the Patrol', time: '10:24 AM' },
      { sender: 'layla', text: "Hello Sara! The 2022 Nissan Patrol Platinum is a stunning choice. It's loaded with the 5.6L V8, Nappa leather, and panoramic roof. Currently listed at AED 210,000. Are you based in Abu Dhabi? We can arrange delivery.", time: '10:24 AM' },
      { sender: 'buyer', text: 'Yes Abu Dhabi. Does it have warranty?', time: '10:25 AM' },
      { sender: 'layla', text: "Yes! It still has 14 months of Nissan factory warranty remaining, and we offer an extended 2-year warranty for AED 4,500. Would you like a full inspection report sent to you?", time: '10:25 AM' },
    ]
  },
  {
    id: 'L003', name: 'Khalid Rashid', phone: '+971 52 111 9900',
    car: '2020 BMW X5 M Sport', budget: 'AED 165,000',
    score: 5, status: 'followup', time: '1h 12m ago', city: 'Sharjah',
    messages: [
      { sender: 'buyer', text: 'Is the BMW X5 still there?', time: '9:10 AM' },
      { sender: 'layla', text: "Hi Khalid! Yes, the X5 M Sport is still available — 2020, 67,000km, full BMW service history, priced at AED 165,000. Shall I send you a full photo set?", time: '9:10 AM' },
      { sender: 'buyer', text: 'Ok send photos', time: '9:12 AM' },
      { sender: 'layla', text: "Photos sent! Let me know what you think. Are you looking to trade in your current vehicle?", time: '9:13 AM' },
    ]
  },
  {
    id: 'L004', name: 'Fatima Al Zaabi', phone: '+971 56 432 0011',
    car: '2023 Range Rover Sport HSE', budget: 'AED 310,000',
    score: 9, status: 'active', time: '34m ago', city: 'Dubai',
    messages: [
      { sender: 'buyer', text: 'Range Rover Sport — is it available and what colour?', time: '10:08 AM' },
      { sender: 'layla', text: "Hi Fatima! The 2023 Range Rover Sport HSE is available in Santorini Black with a Ebony interior — truly stunning. 18,000km, fully loaded including Meridian sound and air suspension. AED 310,000. Shall I hold it for you while you review?", time: '10:08 AM' },
      { sender: 'buyer', text: 'Yes please hold it. I can come Saturday', time: '10:10 AM' },
      { sender: 'layla', text: "Perfect! I've flagged it as reserved for you until Saturday. I'll send a confirmation now and call you Friday to confirm the time. Is morning or afternoon better for you?", time: '10:10 AM' },
    ]
  },
  {
    id: 'L005', name: 'Mohammed Al Shehri', phone: '+971 54 788 2200',
    car: '2019 Lexus LX 570', budget: 'AED 195,000',
    score: 3, status: 'cold', time: '26h ago', city: 'Dubai',
    messages: [
      { sender: 'buyer', text: 'Price for LX 570?', time: 'Yesterday' },
      { sender: 'layla', text: "Hi Mohammed! The Lexus LX 570 is listed at AED 195,000 — 2019, 88,000km, 7-seater, full Lexus service history. Would you like to schedule a viewing?", time: 'Yesterday' },
    ]
  },
  {
    id: 'L006', name: 'Reem Al Nuaimi', phone: '+971 50 312 9944',
    car: '2022 Mercedes GLE 450', budget: 'AED 245,000',
    score: 6, status: 'followup', time: '5h ago', city: 'Abu Dhabi',
    messages: [
      { sender: 'buyer', text: 'Is the GLE 450 automatic?', time: '5:30 AM' },
      { sender: 'layla', text: "Yes Reem, it's a 9-speed automatic — incredibly smooth. 2022 GLE 450, AMG Line, Burmester sound system, AED 245,000. Can I book a test drive for you?", time: '5:31 AM' },
      { sender: 'buyer', text: 'Maybe next week, I need to think', time: '5:33 AM' },
      { sender: 'layla', text: "No rush! I'll follow up with you in 24 hours with some exclusive photos and a comparison sheet. This model moves fast in Abu Dhabi — I want to make sure you don't miss it. 😊", time: '5:34 AM' },
    ]
  },
]

export const mockInventory = [
  { id: 'V001', name: '2021 Toyota Land Cruiser GXR', price: 'AED 185,000', km: '42,000', status: 'reserved', enquiries: 4 },
  { id: 'V002', name: '2022 Nissan Patrol Platinum', price: 'AED 210,000', km: '28,000', status: 'available', enquiries: 2 },
  { id: 'V003', name: '2020 BMW X5 M Sport', price: 'AED 165,000', km: '67,000', status: 'available', enquiries: 1 },
  { id: 'V004', name: '2023 Range Rover Sport HSE', price: 'AED 310,000', km: '18,000', status: 'reserved', enquiries: 3 },
  { id: 'V005', name: '2019 Lexus LX 570', price: 'AED 195,000', km: '88,000', status: 'available', enquiries: 1 },
  { id: 'V006', name: '2022 Mercedes GLE 450', price: 'AED 245,000', km: '34,000', status: 'available', enquiries: 2 },
  { id: 'V007', name: '2021 Porsche Cayenne S', price: 'AED 285,000', km: '51,000', status: 'sold', enquiries: 6 },
]
