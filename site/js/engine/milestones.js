// Personal age milestones (brief §4): RMF unlocks tax-free at 55,
// NSF pension age 60, the ฿190,000 income exemption at 65.
export function personalMilestones(birthYear, _nowYear) {
  return [
    { id: 'rmf55', age: 55, year: birthYear + 55 },
    { id: 'nsf60', age: 60, year: birthYear + 60 },
    { id: 'exempt65', age: 65, year: birthYear + 65 },
  ];
}
