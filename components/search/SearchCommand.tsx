'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { createClient } from '@/lib/supabase/client';

export function SearchCommand() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  React.useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const searchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, category:categories(name)')
        .ilike('name', `%${query}%`)
        .eq('status', 'active')
        .limit(5);
      
      if (data) setResults(data);
    };

    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [query, supabase]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search products...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Type a command or search..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {results.length > 0 && (
            <CommandGroup heading="Products">
              {results.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    runCommand(() => router.push(`/products/${product.slug}`));
                  }}
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span>{product.name}</span>
                  {product.category && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      in {product.category.name}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          <CommandGroup heading="Suggestions">
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/products'));
              }}
            >
              <Search className="mr-2 h-4 w-4" />
              <span>Browse all products</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/categories'));
              }}
            >
              <Search className="mr-2 h-4 w-4" />
              <span>Browse categories</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
