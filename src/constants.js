// -------------------------
// Constants - Map Configuration
// -------------------------
export const DEFAULT_MAP_CENTER = [48.8566, 2.3522]; // Paris
export const DEFAULT_MAP_ZOOM = 6;
export const FIT_PADDING = [40, 40];
export const FIT_MAX_ZOOM = 8;

// -------------------------
// Constants - Storage Keys
// -------------------------
export const STORAGE_LISTS = 'trelloLists';
export const STORAGE_CARDS = 'trelloCards';
export const STORAGE_CUSTOM_LABELS = 'trelloCustomLabels';
export const STORAGE_ACTIVE_VIEW = 'trelloActiveView';
export const STORAGE_MAP_VIEW = 'trelloMapView';

// -------------------------
// Constants - Label Colors Palette
// -------------------------
export const PALETTE_COLORS = [
  '#FF6B6B', '#FFA500', '#FFD93D', '#6BCB77', '#4D96FF',
  '#9D4EDD', '#FF006E', '#00F5FF', '#8B5CF6', '#EC4899',
  '#14B8A6', '#F97316', '#84CC16', '#06B6D4', '#A855F7'
];

// -------------------------
// Constants - Image Collections (Unsplash)
// -------------------------
export const IMAGE_COLLECTIONS = {
  // Monuments & landmarks
  'tour eiffel': ['https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=800', 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800'],
  'paris': ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800'],
  'london': ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800', 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800'],
  'new york': ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800'],
  'tokyo': ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800', 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800'],

  // Nature
  'plage': ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800', 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800'],
  'beach': ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800', 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800'],
  'montagne': ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800'],
  'mountain': ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800'],
  'foret': ['https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800', 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800'],
  'forest': ['https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800', 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800'],
  'lac': ['https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'],
  'lake': ['https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'],

  // Places
  'restaurant': ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'],
  'cafe': ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'],
  'hotel': ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'],
  'musee': ['https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800', 'https://images.unsplash.com/photo-1503152394-c571994fd383?w=800', 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800'],
  'museum': ['https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800', 'https://images.unsplash.com/photo-1503152394-c571994fd383?w=800', 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800'],
  'shopping': ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800'],
  'parc': ['https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800', 'https://images.unsplash.com/photo-1496429862132-5ab36b6ae330?w=800', 'https://images.unsplash.com/photo-1558101776-36d2a8b0f9a6?w=800'],
  'park': ['https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800', 'https://images.unsplash.com/photo-1496429862132-5ab36b6ae330?w=800', 'https://images.unsplash.com/photo-1558101776-36d2a8b0f9a6?w=800'],

  // Activities
  'voyage': ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800'],
  'travel': ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800'],
  'avion': ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800', 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800', 'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=800'],
  'airport': ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800', 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800', 'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=800'],

  // Default/generic
  'default': ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800']
};
