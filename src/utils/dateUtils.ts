/**
 * Date and Baby Age calculation utilities
 */

export function calculateBabyAge(birthDateStr?: string): {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  formatted: string;
  shortFormatted: string;
} {
  if (!birthDateStr) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      formatted: 'Chưa cập nhật ngày sinh',
      shortFormatted: '---',
    };
  }

  const birthDate = new Date(birthDateStr);
  const today = new Date();

  // If birthdate is in the future
  if (birthDate > today) {
    const diffTime = birthDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      years: 0,
      months: 0,
      days: diffDays,
      totalDays: diffDays,
      formatted: `Dự sinh sau ${diffDays} ngày nữa`,
      shortFormatted: `Còn ${diffDays} ngày`,
    };
  }

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    // Get previous month days
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const diffTime = Math.abs(today.getTime() - birthDate.getTime());
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} tuổi`);
  if (months > 0) parts.push(`${months} tháng`);
  if (days > 0 || parts.length === 0) parts.push(`${days} ngày`);

  return {
    years,
    months,
    days,
    totalDays,
    formatted: parts.join(' '),
    shortFormatted: years > 0 ? `${years}T ${months}th` : `${months} tháng ${days} ngày`,
  };
}

export function calculatePregnancyProgress(dueDateStr?: string): {
  currentWeek: number;
  currentDayInWeek: number;
  daysRemaining: number;
  trimester: number;
  babyFruitComparison: string;
  formatted: string;
} {
  if (!dueDateStr) {
    return {
      currentWeek: 20,
      currentDayInWeek: 0,
      daysRemaining: 140,
      trimester: 2,
      babyFruitComparison: 'Quả chuối 🍌',
      formatted: 'Tuần 20',
    };
  }

  const dueDate = new Date(dueDateStr);
  const today = new Date();
  
  // Total pregnancy is approx 280 days (40 weeks)
  const diffTime = dueDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const daysPassed = Math.max(0, 280 - daysRemaining);

  const currentWeek = Math.min(40, Math.floor(daysPassed / 7) + 1);
  const currentDayInWeek = daysPassed % 7;

  let trimester = 1;
  if (currentWeek > 27) trimester = 3;
  else if (currentWeek > 13) trimester = 2;

  // Fruit comparison by week
  const fruitByWeek: Record<number, string> = {
    4: 'Hạt vừng bé xíu 🌱',
    6: 'Hạt đậu lăng 🫘',
    8: 'Quả phúc bồn tử 🍇',
    10: 'Quả quất thơm 🍊',
    12: 'Quả mận tím 🫐',
    14: 'Quả chanh vàng 🍋',
    16: 'Quả bơ béo ngậy 🥑',
    18: 'Quả ớt chuông 🫑',
    20: 'Quả chuối tiêu 🍌',
    22: 'Quả đu đủ nhỏ 🥭',
    24: 'Bắp ngô ngọt 🌽',
    26: 'Củ hành tây 🧅',
    28: 'Quả cà tím 🍆',
    30: 'Cải bắp tròn 🥬',
    32: 'Quả dưa hấu nhỏ 🍉',
    34: 'Quả bí ngô vàng 🎃',
    36: 'Cây xà lách giòn 🥗',
    38: 'Quả mít nhỏ 🍈',
    40: 'Quả dưa hấu ngọt lịm 🍉',
  };

  // Find nearest fruit
  const availableWeeks = Object.keys(fruitByWeek).map(Number).sort((a, b) => a - b);
  let closestWeek = availableWeeks[0];
  for (const w of availableWeeks) {
    if (currentWeek >= w) closestWeek = w;
  }
  const babyFruitComparison = fruitByWeek[closestWeek] || 'Thiên thần nhỏ 👶';

  return {
    currentWeek,
    currentDayInWeek,
    daysRemaining,
    trimester,
    babyFruitComparison,
    formatted: `Tuần ${currentWeek}${currentDayInWeek > 0 ? ` + ${currentDayInWeek} ngày` : ''}`,
  };
}

export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}
