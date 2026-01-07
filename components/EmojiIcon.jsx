import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Text } from 'react-native';

/**
 * Maps emoji strings to MaterialIcons for cross-platform compatibility.
 * This ensures icons work on Raspberry Pi and other Linux systems where
 * Windows emoji fonts are not available.
 */
const EMOJI_TO_ICON_MAP = {
  // Sun/Weather
  '☀️': { name: 'wb-sunny', type: 'material', color: '#FFB800' }, // Bright yellow
  '🌤️': { name: 'wb-cloudy', type: 'material', color: '#87CEEB' }, // Sky blue
  '🌅': { name: 'wb-sunny', type: 'material', color: '#FF8C00' }, // Orange sunrise
  '🌙': { name: 'brightness-3', type: 'material', color: '#9370DB' }, // Purple moon
  
  // Activities
  '🦷': { name: 'content-cut', type: 'material', color: '#20B2AA' }, // Teal
  '👕': { name: 'checkroom', type: 'material', color: '#4169E1' }, // Royal blue
  '🎒': { name: 'school', type: 'material', color: '#FF6347' }, // Tomato red
  '🎁': { name: 'card-giftcard', type: 'material', color: '#FF1493' }, // Deep pink
  '🚂': { name: 'train', type: 'material', color: '#32CD32' }, // Lime green
  '📚': { name: 'menu-book', type: 'material', color: '#8B4513' }, // Saddle brown
  '❤️': { name: 'favorite', type: 'material', color: '#DC143C' }, // Crimson red
  '🛏️': { name: 'hotel', type: 'material', color: '#DDA0DD' }, // Plum
  '⭐': { name: 'star', type: 'material', color: '#FFD700' }, // Gold
  '🎵': { name: 'music-note', type: 'material', color: '#BA55D3' }, // Medium orchid
  '🎨': { name: 'palette', type: 'material', color: '#FF69B4' }, // Hot pink
  '🍎': { name: 'restaurant', type: 'material', color: '#FF4500' }, // Orange red
  '🚿': { name: 'shower', type: 'material', color: '#00CED1' }, // Dark turquoise
  '🧼': { name: 'cleaning-services', type: 'material', color: '#00BFFF' }, // Deep sky blue
  '👟': { name: 'sports-soccer', type: 'material', color: '#228B22' }, // Forest green
  '📱': { name: 'smartphone', type: 'material', color: '#1E90FF' }, // Dodger blue
  '🍽️': { name: 'restaurant', type: 'material', color: '#FF6347' }, // Tomato red
  '🧸': { name: 'toys', type: 'material', color: '#FFB6C1' }, // Light pink
  '🎯': { name: 'sports-esports', type: 'material', color: '#9370DB' }, // Medium purple
  '🎪': { name: 'celebration', type: 'material', color: '#FF1493' }, // Deep pink
  '🌈': { name: 'invert-colors', type: 'material', color: '#FF69B4' }, // Hot pink (rainbow)
  '🔍': { name: 'search', type: 'material', color: '#4682B4' }, // Steel blue
  '💡': { name: 'lightbulb', type: 'material', color: '#FFD700' }, // Gold
  
  // Actions
  '▶️': { name: 'play-arrow', type: 'material', color: '#32CD32' }, // Lime green
  '⏭️': { name: 'skip-next', type: 'material', color: '#1E90FF' }, // Dodger blue
  '✏️': { name: 'edit', type: 'material', color: '#4169E1' }, // Royal blue
  '🗑️': { name: 'delete', type: 'material', color: '#DC143C' }, // Crimson red
  '📤': { name: 'cloud-upload', type: 'material', color: '#00CED1' }, // Dark turquoise
  '🎤': { name: 'mic', type: 'material', color: '#FF4500' }, // Orange red
  '📖': { name: 'menu-book', type: 'material', color: '#8B4513' }, // Saddle brown
  '✅': { name: 'check-circle', type: 'material', color: '#32CD32' }, // Lime green
  '➕': { name: 'add', type: 'material', color: '#20B2AA' }, // Teal
  '📊': { name: 'bar-chart', type: 'material', color: '#9370DB' }, // Medium purple
};

/**
 * Icon component that renders MaterialIcons instead of emojis
 * @param {string} emoji - The emoji string (e.g., "☀️")
 * @param {number} size - Icon size (default: 18)
 * @param {string} color - Icon color (optional, will use emoji's default color if not provided)
 * @param {object} style - Additional styles
 */
export default function EmojiIcon({ emoji, size = 18, color, style }) {
  const iconMapping = EMOJI_TO_ICON_MAP[emoji];
  
  if (!iconMapping) {
    // Fallback to text emoji if mapping not found (shouldn't happen in production)
    console.warn(`No icon mapping found for emoji: ${emoji}`);
    const fallbackColor = color || "#2c3e50";
    return <Text style={[{ fontSize: size, color: fallbackColor }, style]}>{emoji}</Text>;
  }
  
  // Use provided color, or fall back to emoji's default color, or default gray
  const iconColor = color || iconMapping.color || "#2c3e50";
  
  return (
    <MaterialIcons
      name={iconMapping.name}
      size={size}
      color={iconColor}
      style={style}
    />
  );
}

/**
 * Get the MaterialIcon name for an emoji string
 * Useful for cases where you need the icon name directly
 */
export function getIconName(emoji) {
  const iconMapping = EMOJI_TO_ICON_MAP[emoji];
  return iconMapping ? iconMapping.name : null;
}

/**
 * Check if an emoji has an icon mapping
 */
export function hasIconMapping(emoji) {
  return emoji in EMOJI_TO_ICON_MAP;
}

/**
 * Get all available emoji strings that have mappings
 */
export function getAvailableEmojis() {
  return Object.keys(EMOJI_TO_ICON_MAP);
}

