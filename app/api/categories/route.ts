import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CategoryTree } from '@/types/product';

// GET /api/categories - Get all active categories in tree structure
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all active categories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Build tree structure
    const categoryTree = buildCategoryTree(categories || []);

    return NextResponse.json({
      categories: categoryTree,
    });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Build a tree structure from flat categories array
 */
function buildCategoryTree(categories: any[]): CategoryTree[] {
  const categoryMap = new Map<string, CategoryTree>();
  const roots: CategoryTree[] = [];

  // First pass: create map of all categories
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build tree
  categories.forEach((cat) => {
    const category = categoryMap.get(cat.id)!;
    if (cat.parent_id && categoryMap.has(cat.parent_id)) {
      categoryMap.get(cat.parent_id)!.children.push(category);
    } else {
      roots.push(category);
    }
  });

  return roots;
}
