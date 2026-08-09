import { Expense } from '../types';

export type FoodGroup = 'essential' | 'outside' | 'junk' | 'other';

export const FOOD_GROUPS: Record<FoodGroup, { label: string; description: string; color: string }> = {
  essential: { label: 'Essential Food', description: 'Groceries, fresh produce, milk, and cooking staples', color: '#86B88A' }, // Premium Success green
  outside: { label: 'Outside Food', description: 'Restaurants, delivery, takeaway, and cafes', color: '#A9653F' }, // Copper
  junk: { label: 'Junk & Treats', description: 'Snacks, soft drinks, desserts, and packaged treats', color: '#D6A85F' }, // Gold
  other: { label: 'Other', description: 'Unclassified food expenses', color: '#A9A39A' } // Muted grey
};

export const SUBCATEGORIES_MAP: Record<string, FoodGroup> = {
  // Essential Food
  groceries: 'essential',
  vegetables: 'essential',
  fruits: 'essential',
  milk: 'essential',
  ingredients: 'essential',
  cooking: 'essential',
  staples: 'essential',
  
  // Outside Food
  restaurant: 'outside',
  restaurants: 'outside',
  delivery: 'outside',
  takeaway: 'outside',
  cafe: 'outside',
  streetfood: 'outside',
  dinein: 'outside',
  outside_food: 'outside',
  
  // Junk / Treats
  chips: 'junk',
  softdrinks: 'junk',
  soda: 'junk',
  desserts: 'junk',
  icecream: 'junk',
  snacks: 'junk',
  treats: 'junk',
  sweets: 'junk',
  chocolate: 'junk'
};

export function classifyFoodExpense(expense: Expense): FoodGroup {
  if (expense.category.toLowerCase() !== 'food') {
    return 'other';
  }
  
  // Check subcategory if it exists
  if (expense.subcategory) {
    const sub = expense.subcategory.toLowerCase().trim();
    if (SUBCATEGORIES_MAP[sub]) {
      return SUBCATEGORIES_MAP[sub];
    }
  }
  
  // Fallback to description scanning
  const desc = expense.description?.toLowerCase() || '';
  const note = expense.note?.toLowerCase() || '';
  const merchant = expense.merchant?.toLowerCase() || '';
  
  const textToScan = `${desc} ${note} ${merchant}`;
  
  // Outside food keywords
  if (/swiggy|zomato|ubereats|restaurant|cafe|coffee|starbucks|pizza|burger|takeaway|deli|street|swiggy|foodpanda/i.test(textToScan)) {
    return 'outside';
  }
  
  // Junk food keywords
  if (/chips|coke|pepsi|soda|ice cream|chocolate|candy|snack|dessert|donut|cake|sweet/i.test(textToScan)) {
    return 'junk';
  }
  
  // Essential food keywords
  if (/grocery|supermarket|market|vegetable|fruit|milk|staple|egg|bread|butter|cheese/i.test(textToScan)) {
    return 'essential';
  }
  
  return 'essential'; // default to essential food if classified as Food
}
