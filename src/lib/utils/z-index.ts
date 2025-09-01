/**
 * Z-Index Management System
 * Centralized z-index values to prevent conflicts between overlapping UI elements
 */

export const zIndex = {
  // Base layers
  base: 0,
  dropdown: 10,
  sticky: 20,
  
  // Fixed elements
  fixedHeader: 30,
  mobileNav: 40,
  
  // Overlays and modals
  overlay: 50,
  modal: 60,
  
  // Notifications and tooltips
  tooltip: 70,
  notification: 80,
  toast: 90,
  
  // Critical UI elements (should always be on top)
  popover: 100,
  contextMenu: 110,
  commandPalette: 120,
  
  // Game-specific overlays
  gameHeader: 35,
  playerListOverlay: 45,
  combatTracker: 55,
  combatLog: 55,
  notesPanel: 55,
  characterSheet: 45,
  
  // Maximum z-index (use sparingly)
  maximum: 9999,
} as const

/**
 * Helper function to get z-index CSS value
 */
export function getZIndex(layer: keyof typeof zIndex): string {
  return `z-${zIndex[layer]}`
}

/**
 * Helper function to get inline style z-index
 */
export function getZIndexStyle(layer: keyof typeof zIndex): { zIndex: number } {
  return { zIndex: zIndex[layer] }
}

/**
 * Tailwind classes for common z-index values
 * Use these in className props for consistency
 */
export const zIndexClasses = {
  base: 'z-0',
  dropdown: 'z-10',
  sticky: 'z-20',
  fixedHeader: 'z-30',
  gameHeader: 'z-[35]',
  mobileNav: 'z-40',
  playerListOverlay: 'z-[45]',
  characterSheet: 'z-[45]',
  overlay: 'z-50',
  combatTracker: 'z-[55]',
  combatLog: 'z-[55]',
  notesPanel: 'z-[55]',
  modal: 'z-[60]',
  tooltip: 'z-[70]',
  notification: 'z-[80]',
  toast: 'z-[90]',
  popover: 'z-[100]',
  contextMenu: 'z-[110]',
  commandPalette: 'z-[120]',
  maximum: 'z-[9999]',
} as const

/**
 * Type-safe z-index getter for Tailwind classes
 */
export function zClass(layer: keyof typeof zIndexClasses): string {
  return zIndexClasses[layer]
}