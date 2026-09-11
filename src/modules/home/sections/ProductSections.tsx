import { memo, useEffect, useState, type ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type Product = {
  id: number;
  name: string;
  brand: string;
  rating: number;
  price: number;
  discountedPrice: number;
  discountPercent: number;
  emi: number;
  image: string;
};

type ProductCardProps = {
  product: Product;
};

const dummyProducts: Product[] = [
  {
    id: 1,
    name: 'Modern Designer LED Round Wall Mirror',
    brand: 'VibeCrafts',
    rating: 2,
    price: 9999,
    discountedPrice: 5270,
    discountPercent: 47,
    emi: 254,
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=300&fit=crop',
  },
  {
    id: 2,
    name: 'Elegant Wooden Wall Clock',
    brand: 'Timeless',
    rating: 4,
    price: 4500,
    discountedPrice: 2999,
    discountPercent: 33,
    emi: 150,
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400&h=300&fit=crop',
  },
  {
    id: 3,
    name: 'Minimalist Desk Lamp',
    brand: 'Lume',
    rating: 5,
    price: 3200,
    discountedPrice: 2199,
    discountPercent: 31,
    emi: 110,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=300&fit=crop',
  },
  {
    id: 4,
    name: 'Handmade Ceramic Vase Set',
    brand: 'ArtisanHome',
    rating: 3,
    price: 2800,
    discountedPrice: 1899,
    discountPercent: 32,
    emi: 95,
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=300&fit=crop',
  },
  {
    id: 5,
    name: 'Modern Designer LED Round Wall Mirror',
    brand: 'VibeCrafts',
    rating: 2,
    price: 9999,
    discountedPrice: 5270,
    discountPercent: 47,
    emi: 254,
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=300&fit=crop',
  },
  {
    id: 6,
    name: 'Elegant Wooden Wall Clock',
    brand: 'Timeless',
    rating: 4,
    price: 4500,
    discountedPrice: 2999,
    discountPercent: 33,
    emi: 150,
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400&h=300&fit=crop',
  },
  {
    id: 7,
    name: 'Minimalist Desk Lamp',
    brand: 'Lume',
    rating: 5,
    price: 3200,
    discountedPrice: 2199,
    discountPercent: 31,
    emi: 110,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=300&fit=crop',
  },
  {
    id: 8,
    name: 'Handmade Ceramic Vase Set',
    brand: 'ArtisanHome',
    rating: 3,
    price: 2800,
    discountedPrice: 1899,
    discountPercent: 32,
    emi: 95,
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=300&fit=crop',
  },
   {
    id: 1,
    name: 'Modern Designer LED Round Wall Mirror',
    brand: 'VibeCrafts',
    rating: 2,
    price: 9999,
    discountedPrice: 5270,
    discountPercent: 47,
    emi: 254,
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=300&fit=crop',
  },
  {
    id: 2,
    name: 'Elegant Wooden Wall Clock',
    brand: 'Timeless',
    rating: 4,
    price: 4500,
    discountedPrice: 2999,
    discountPercent: 33,
    emi: 150,
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400&h=300&fit=crop',
  },
  {
    id: 3,
    name: 'Minimalist Desk Lamp',
    brand: 'Lume',
    rating: 5,
    price: 3200,
    discountedPrice: 2199,
    discountPercent: 31,
    emi: 110,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=300&fit=crop',
  },
  {
    id: 4,
    name: 'Handmade Ceramic Vase Set',
    brand: 'ArtisanHome',
    rating: 3,
    price: 2800,
    discountedPrice: 1899,
    discountPercent: 32,
    emi: 95,
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=300&fit=crop',
  },
  {
    id: 5,
    name: 'Modern Designer LED Round Wall Mirror',
    brand: 'VibeCrafts',
    rating: 2,
    price: 9999,
    discountedPrice: 5270,
    discountPercent: 47,
    emi: 254,
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=300&fit=crop',
  },
  {
    id: 6,
    name: 'Elegant Wooden Wall Clock',
    brand: 'Timeless',
    rating: 4,
    price: 4500,
    discountedPrice: 2999,
    discountPercent: 33,
    emi: 150,
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400&h=300&fit=crop',
  },
  {
    id: 7,
    name: 'Minimalist Desk Lamp',
    brand: 'Lume',
    rating: 5,
    price: 3200,
    discountedPrice: 2199,
    discountPercent: 31,
    emi: 110,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=300&fit=crop',
  },
  {
    id: 8,
    name: 'Handmade Ceramic Vase Set',
    brand: 'ArtisanHome',
    rating: 3,
    price: 2800,
    discountedPrice: 1899,
    discountPercent: 32,
    emi: 95,
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=300&fit=crop',
  },
];

const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const {
    name,
    brand,
    rating,
    price,
    discountedPrice,
    discountPercent,
    image,
  } = product;

  const fullStars = Math.floor(rating);

  return (
    <Link
      to={`/product/${product.id}`}
      aria-label={`View ${name}`}
      style={{
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.BorderRadius.lg,
        boxShadow: Theme.Shadow.md,
      }}
      className="block overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-black/25 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      <img src={image} alt={name} className="w-full h-52 object-cover" />
      <div className="p-4">
        <h3
          style={{ color: Theme.colors.text }}
          className="font-semibold text-lg line-clamp-2"
        >
          {name}
        </h3>
        <p style={{ color: Theme.colors.textLight }} className="text-sm mt-1">
          By {brand}
        </p>
        <div className="flex items-center mt-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              style={{
                color: i < fullStars ? Theme.colors.gold : Theme.colors.border,
                fill: i < fullStars ? Theme.colors.gold : 'none',
              }}
              className={i < fullStars ? 'fill-current' : ''}
            />
          ))}
          <span
            style={{ color: Theme.colors.textMuted }}
            className="ml-1 text-sm"
          >
            ({rating})
          </span>
        </div>
        <div className="mt-3 flex items-baseline flex-wrap">
          <span
            style={{ color: Theme.colors.text }}
            className="text-xl font-bold"
          >
            ₹{discountedPrice.toLocaleString()}
          </span>
          <span
            style={{ color: Theme.colors.textMuted }}
            className="ml-2 text-sm line-through"
          >
            ₹{price.toLocaleString()}
          </span>
          <span
            style={{ color: Theme.colors.accent }}
            className="ml-2 text-sm font-semibold"
          >
            {discountPercent}% off
          </span>
        </div>
      </div>
    </Link>
  );
});

const ThemedSkeleton = memo(function ThemedSkeleton({
  className,
  style,
  ...props
}: ComponentProps<'div'>) {
  return (
    <Skeleton
      className={cn('rounded-md', className)}
      style={{ backgroundColor: Theme.colors.surfaceAlt, ...style }}
      {...props}
    />
  );
});

// 3 rows of skeleton cards on the lg breakpoint (grid-cols-5 → 5 × 3).
const SKELETON_COUNT = 15;

const ProductCardSkeleton = memo(function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.BorderRadius.lg,
        boxShadow: Theme.Shadow.md,
      }}
      className="overflow-hidden"
    >
      <ThemedSkeleton className="h-52 w-full rounded-none" />
      <div className="p-4">
        <ThemedSkeleton className="h-5 w-11/12" />
        <ThemedSkeleton className="mt-2 h-5 w-2/3" />
        <ThemedSkeleton className="mt-3 h-3 w-1/3" />
        <div className="mt-3 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <ThemedSkeleton key={i} className="h-4 w-4" />
          ))}
          <ThemedSkeleton className="ml-1 h-3.5 w-8" />
        </div>
        <div className="mt-3 flex items-baseline flex-wrap gap-x-2">
          <ThemedSkeleton className="h-6 w-24" />
          <ThemedSkeleton className="h-4 w-14" />
          <ThemedSkeleton className="h-4 w-16" />
        </div>
        <ThemedSkeleton className="mt-3 h-3 w-40" />
      </div>
    </div>
  );
});

type ProductSectionsProps = {
  loading?: boolean;
};

export default function ProductSections({ loading }: ProductSectionsProps = {}) {
  const [isSimulatedLoading, setIsSimulatedLoading] = useState(true);

  useEffect(() => {
    // If the parent drives `loading`, don't auto-hide the skeleton.
    if (loading !== undefined) return;

    const timer = window.setTimeout(() => setIsSimulatedLoading(false), 1600);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const showSkeleton = loading ?? isSimulatedLoading;

  return (
    <section
      style={{ backgroundColor: Theme.colors.background }}
      className="py-8 w-full"
      aria-busy={showSkeleton}
    >
      <div className="px-4 md:px-6 lg:px-8 mx-auto">
        <h2
          style={{ color: Theme.colors.text }}
          className="text-2xl font-bold mb-6"
        >
          Product Sections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {showSkeleton ? (
            <>
              <span className="sr-only">Loading products...</span>
              {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <ProductCardSkeleton key={`skeleton-${index}`} />
              ))}
            </>
          ) : (
            dummyProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}