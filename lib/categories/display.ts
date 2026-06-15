import type { CategoryResponse } from '@/lib/api/types';

/** Vietnamese labels aligned with homepage category tiles. */
const CATEGORY_ID_VI: Record<number, string> = {
  1: 'Làm đẹp',
  2: 'Thời trang',
  3: 'Công nghệ',
  4: 'Ẩm thực',
  5: 'Phong cách sống',
  6: 'Du lịch',
  7: 'Thể thao',
  12: 'Giải trí',
};

/** Fallback when API still returns English names. */
const CATEGORY_NAME_VI: Record<string, string> = {
  'Beauty & Cosmetics': 'Làm đẹp',
  Beauty: 'Làm đẹp',
  'Fashion & Lifestyle': 'Thời trang',
  Fashion: 'Thời trang',
  'Technology & Gadgets': 'Công nghệ',
  Technology: 'Công nghệ',
  'Food & Culinary': 'Ẩm thực',
  'Food & Beverage': 'Ẩm thực',
  'Travel & Adventure': 'Du lịch',
  Travel: 'Du lịch',
  Lifestyle: 'Phong cách sống',
  'Fitness & Health': 'Thể thao & Sức khỏe',
  Sports: 'Thể thao',
  Entertainment: 'Giải trí',
  'Gaming & Esports': 'Game & Esports',
  Gaming: 'Game',
  'E-commerce': 'Thương mại điện tử',
  'Arts & Crafts': 'Nghệ thuật & Thủ công',
};

const CATEGORY_SLUG_VI: Record<string, string> = {
  'lam-dep': 'Làm đẹp',
  beauty: 'Làm đẹp',
  'thoi-trang': 'Thời trang',
  fashion: 'Thời trang',
  'cong-nghe': 'Công nghệ',
  technology: 'Công nghệ',
  'am-thuc': 'Ẩm thực',
  food: 'Ẩm thực',
  'phong-cach-song': 'Phong cách sống',
  lifestyle: 'Phong cách sống',
  'du-lich': 'Du lịch',
  travel: 'Du lịch',
  'the-thao': 'Thể thao',
  sports: 'Thể thao',
  'giai-tri': 'Giải trí',
  entertainment: 'Giải trí',
  game: 'Game',
  gaming: 'Game',
};

export function categoryDisplayLabel(cat: Pick<CategoryResponse, 'id' | 'name' | 'slug'>): string {
  return (
    CATEGORY_ID_VI[cat.id] ??
    CATEGORY_NAME_VI[cat.name] ??
    CATEGORY_SLUG_VI[cat.slug] ??
    cat.name
  );
}

export function flattenCategories(list: CategoryResponse[]): CategoryResponse[] {
  const out: CategoryResponse[] = [];
  for (const category of list) {
    out.push(category);
    if (category.children.length > 0) {
      out.push(...flattenCategories(category.children));
    }
  }
  return out;
}
