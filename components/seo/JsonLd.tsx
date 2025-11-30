interface JsonLdProps {
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Product JSON-LD
export function ProductJsonLd({
  product,
}: {
  product: {
    name: string;
    description: string | null;
    image: string | null;
    price: number;
    currency?: string;
    brand?: string;
    sku?: string;
    ratingValue?: number | null;
    ratingCount?: number;
    availability?: 'InStock' | 'OutOfStock';
  };
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: product.image || '',
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'USD',
      availability: product.availability === 'InStock' 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
    },
    ...(product.brand && { brand: { '@type': 'Brand', name: product.brand } }),
    ...(product.sku && { sku: product.sku }),
    ...(product.ratingValue && product.ratingCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.ratingValue,
        ratingCount: product.ratingCount,
      },
    }),
  };

  return <JsonLd data={data} />;
}

// Organization JSON-LD
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'B_Kart',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://bkart.com',
    logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
    sameAs: [
      // Add social media links here
    ],
  };

  return <JsonLd data={data} />;
}

// Website JSON-LD
export function WebsiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'B_Kart',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://bkart.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <JsonLd data={data} />;
}

// Breadcrumb JSON-LD
export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={data} />;
}

// Review JSON-LD
export function ReviewJsonLd({
  review,
}: {
  review: {
    author: string;
    datePublished: string;
    reviewBody: string;
    ratingValue: number;
    itemReviewed: {
      name: string;
      image?: string;
    };
  };
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    datePublished: review.datePublished,
    reviewBody: review.reviewBody,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.ratingValue,
      bestRating: 5,
    },
    itemReviewed: {
      '@type': 'Product',
      name: review.itemReviewed.name,
      ...(review.itemReviewed.image && { image: review.itemReviewed.image }),
    },
  };

  return <JsonLd data={data} />;
}
