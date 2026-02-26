// Time utility functions for document display

/**
 * Converts a date to a relative time string in the format "Updated X ago"
 * Examples: "Updated 2 minutes ago", "Updated 3 hours ago", "Updated 5 days ago"
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return "Updated just now";
  } else if (diffMinutes < 60) {
    return `Updated ${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `Updated ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `Updated ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffWeeks < 4) {
    return `Updated ${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffMonths < 12) {
    return `Updated ${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  } else {
    return `Updated ${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
  }
}
