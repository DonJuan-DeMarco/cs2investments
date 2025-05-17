/**
 * Format a price from cents to a currency string
 * @param cents Price in cents
 * @returns Formatted price string with dollar sign and two decimal places
 */
export function formatCurrency(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) {
    return 'N/A';
  }
  
  // Convert cents to dollars for display
  const dollars = cents / 100;
  
  // Format with dollar sign and two decimal places
  return `$${dollars.toFixed(2)}`;
} 