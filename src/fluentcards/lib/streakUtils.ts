const STREAK_KEY = 'fc_streak_dates';

function getStreakDates(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveStreakDates(dates: string[]) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(dates));
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function markStudiedToday() {
  const dates = getStreakDates();
  const today = todayKey();
  if (!dates.includes(today)) {
    dates.push(today);
    saveStreakDates(dates);
  }
}

export function computeStreak(): number {
  const dates = getStreakDates().sort().reverse();
  if (dates.length === 0) return 0;

  let streak = 0;
  const today = todayKey();
  const todayDate = new Date(today);

  // Start from today and count backwards
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(todayDate);
    expected.setDate(expected.getDate() - i);
    const expectedKey = expected.toISOString().split('T')[0];

    if (dates.includes(expectedKey)) {
      streak++;
    } else {
      // Allow gap if today hasn't been studied yet but yesterday was studied
      if (i === 0 && dates.includes(expectedKey) === false) {
        // Check if yesterday was studied
        const yesterday = new Date(todayDate);
        yesterday.setDate(yesterday.getDate() - 1);
        if (dates.includes(yesterday.toISOString().split('T')[0])) {
          continue; // skip today, count from yesterday
        }
      }
      break;
    }
  }

  return streak;
}

export function getTotalStudyDays(): number {
  return getStreakDates().length;
}

// Browser notification for reminders
export function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return Promise.resolve(false);
  if (Notification.permission === 'granted') return Promise.resolve(true);
  if (Notification.permission === 'denied') return Promise.resolve(false);
  return Notification.requestPermission().then(perm => perm === 'granted');
}

export function sendStudyReminder(streak: number) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification('FluentCards', {
    body: streak > 0
      ? `You have a ${streak}-day streak! Keep it going — study today.`
      : 'Haven\'t studied yet today? A quick session keeps your memory fresh!',
    icon: '/icon-192.png',
  });
}
