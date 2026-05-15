const { scoreLeadFull } = require('./scorer')

const history1 = [
  { role: 'user', content: 'Okay so I changed my mind! I want a smaller car that looks v cool. What do you suggest' }
]

const history2 = [
  { role: 'user', content: 'Okay so I changed my mind! I want a smaller car that looks v cool. What do you suggest' },
  { role: 'assistant', content: 'Hey, give me just a sec — having a small technical moment. I\'ll be right back with you!' },
  { role: 'user', content: 'Tell me which car is should go for!!' }
]

const history3 = [
  ...history2,
  { role: 'assistant', content: 'For a truly cool and sleek driving experience, consider the Pearl White 2022 Honda Accord.' },
  { role: 'user', content: 'I want a really small car that makes a statement. Something like a beetle. What do you think?' }
]

const history4 = [
  ...history3,
  { role: 'assistant', content: 'For a statement of modern elegance, the Pearl White 2022 Honda Accord is exceptional.' },
  { role: 'user', content: 'Give me top 3 cars in this category first!' }
]

const history5 = [
  ...history4,
  { role: 'assistant', content: 'For a distinctive statement, consider these exceptional options...' },
  { role: 'user', content: 'What do you think about Tata Nano? 🐒' }
]

console.log('--- TEST 1 ---')
console.log(scoreLeadFull(history1))

console.log('--- TEST 2 ---')
console.log(scoreLeadFull(history2))

console.log('--- TEST 3 ---')
console.log(scoreLeadFull(history3))

console.log('--- TEST 4 ---')
console.log(scoreLeadFull(history4))

console.log('--- TEST 5 ---')
console.log(scoreLeadFull(history5))
