/**
 * Utility functions for formatting values in the e-commerce client.
 */

/**
 * Formats a numeric price to USD currency representation.
 * @param {number|string} amount 
 * @returns {string} Formatted price (e.g. $1,299.00)
 */
export const formatPrice = (amount) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numericAmount);
};

/**
 * Formats an ISO date string into a readable local date and time.
 * @param {string} dateString 
 * @returns {string} Formatted date (e.g., Jun 8, 2026, 7:25 PM)
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'N/A';
  }
};
