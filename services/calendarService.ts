
// services/calendarService.ts

export interface HolidayEvent {
  date: string; // YYYY-MM-DD
  name: string;
}

// Helper to generate a range of dates for long vacations (Winter/Summer breaks)
const generateDateRange = (startDate: string, endDate: string, name: string): Record<string, string> => {
  const dates: Record<string, string> = {};
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Loop through dates
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dates[dateStr] = name;
  }
  return dates;
};

// Hardcoded Official Holidays Data (2024-2026)
// Source: User specific request + Official Gazette of Pakistan
const OFFICIAL_HOLIDAYS: Record<string, string> = {
    // --- 2024 Dates (Retained for history) ---
    '2024-02-05': 'Kashmir Day',
    '2024-03-23': 'Pakistan Day',
    '2024-04-10': 'Eid-ul-Fitr (Day 1)',
    '2024-04-11': 'Eid-ul-Fitr (Day 2)',
    '2024-04-12': 'Eid-ul-Fitr (Day 3)',
    '2024-05-01': 'Labor Day',
    '2024-06-17': 'Eid-ul-Adha (Day 1)',
    '2024-06-18': 'Eid-ul-Adha (Day 2)',
    '2024-06-19': 'Eid-ul-Adha (Day 3)',
    '2024-07-16': 'Ashura (9th Muharram)',
    '2024-07-17': 'Ashura (10th Muharram)',
    '2024-08-14': 'Independence Day',
    '2024-09-17': 'Eid Milad-un-Nabi',
    '2024-11-09': 'Iqbal Day',
    '2024-12-25': 'Quaid-e-Azam Day',
    
    // --- 2025 Dates ---
    '2025-02-05': 'Kashmir Day',
    '2025-03-23': 'Pakistan Day',
    '2025-03-31': 'Eid-ul-Fitr (Day 1)',
    '2025-04-01': 'Eid-ul-Fitr (Day 2)',
    '2025-04-02': 'Eid-ul-Fitr (Day 3)',
    '2025-05-01': 'Labor Day',
    '2025-06-06': 'Eid-ul-Adha (Day 1)',
    '2025-06-07': 'Eid-ul-Adha (Day 2)',
    '2025-06-08': 'Eid-ul-Adha (Day 3)',
    '2025-07-05': 'Ashura (9th Muharram)',
    '2025-07-06': 'Ashura (10th Muharram)',
    '2025-08-14': 'Independence Day',
    '2025-09-05': 'Eid Milad-un-Nabi',
    '2025-11-09': 'Iqbal Day',
    '2025-12-25': 'Quaid-e-Azam Day',
    
    // 2025 Winter Break (Requested: 22 Dec - 31 Dec)
    ...generateDateRange('2025-12-22', '2025-12-31', 'Winter Break'),

    // --- 2026 Dates (Requested Specifics) ---
    '2026-01-01': 'New Year’s Day (Optional)',
    '2026-02-05': 'Kashmir Solidarity Day',
    '2026-03-21': 'Eid-ul-Fitr (Day 1)',
    '2026-03-22': 'Eid-ul-Fitr (Day 2)',
    '2026-03-23': 'Pakistan Day / Eid-ul-Fitr (Day 3)',
    '2026-05-01': 'Labour Day',
    '2026-05-27': 'Eid-ul-Azha (Day 1)',
    '2026-05-28': 'Eid-ul-Azha (Day 2) / Youm-e-Takbeer',
    '2026-06-25': 'Ashura (Day 1)',
    '2026-06-26': 'Ashura (Day 2)',
    '2026-08-14': 'Independence Day',
    '2026-08-25': 'Eid Milad-un-Nabi',
    '2026-11-09': 'Iqbal Day',
    '2026-12-25': 'Quaid-e-Azam Day / Christmas',

    // 2026 Summer Break (Requested: 1 Jun - 31 Jul)
    ...generateDateRange('2026-06-01', '2026-07-31', 'Summer Break'),
};

export const fetchPublicHolidays = async (year: number): Promise<Record<string, string>> => {
  // Return the static list directly. No external API calls.
  // We simulate an async response to match the existing component interface.
  return new Promise((resolve) => {
      // Filter holidays for the requested year to keep the object size manageable in the UI logic,
      // although returning the whole set is also fine.
      const yearlyHolidays: Record<string, string> = {};
      Object.keys(OFFICIAL_HOLIDAYS).forEach(date => {
          if (date.startsWith(year.toString())) {
              yearlyHolidays[date] = OFFICIAL_HOLIDAYS[date];
          }
      });
      resolve(yearlyHolidays);
  });
};
