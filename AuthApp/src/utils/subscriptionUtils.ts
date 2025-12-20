/**
 * Check if a date is within the free tier range (last 7 days)
 * @param date - Date string in YYYY-MM-DD format
 * @param isPremium - Whether user has premium subscription
 * @returns true if date is accessible, false otherwise
 */
export const isDateInFreeRange = (date: string, isPremium: boolean): boolean => {
  if (isPremium) return true; // Premium users have unlimited access
  
  const dateObj = new Date(date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff >= 0 && daysDiff < 7; // Last 7 days including today (0-6 days ago)
};

/**
 * Get the earliest date a free user can access
 * @returns Date string in YYYY-MM-DD format (7 days ago, including today = 7 days)
 */
export const getFreeTierEarliestDate = (): string => {
  const today = new Date();
  today.setDate(today.getDate() - 6); // 7 days ago (including today = 7 days total)
  return today.toISOString().split('T')[0];
};

/**
 * Check if user can access a specific date
 * @param date - Date string in YYYY-MM-DD format
 * @param isPremium - Whether user has premium subscription
 * @returns true if user can access the date, false otherwise
 */
export const canAccessDate = (date: string, isPremium: boolean): boolean => {
  if (isPremium) return true;
  
  const dateObj = new Date(date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Can't access future dates (applies to both free and premium)
  if (dateObj > today) return false;
  
  // Can access last 7 days for free users
  return isDateInFreeRange(date, false);
};

/**
 * Get a user-friendly message about date restrictions
 * @param isPremium - Whether user has premium subscription
 * @returns Message string
 */
export const getDateRestrictionMessage = (isPremium: boolean): string => {
  if (isPremium) return '';
  const earliestDate = getFreeTierEarliestDate();
  const date = new Date(earliestDate + 'T00:00:00');
  const formattedDate = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  return `Free users can access the last 7 days (from ${formattedDate}). Upgrade to Premium for unlimited history!`;
};

