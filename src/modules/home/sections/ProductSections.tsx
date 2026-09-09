import  { memo } from 'react';
import { Star } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';

const dummyProducts = [
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

const ProductCard = memo(function ProductCard({ product }) {
  const {
    name,
    brand,
    rating,
    price,
    discountedPrice,
    discountPercent,
    emi,
    image,
  } = product;

  const fullStars = Math.floor(rating);

  return (
    <div
      style={{
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.BorderRadius.lg,
        boxShadow: Theme.Shadow.md,
      }}
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
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
        <p
          style={{ color: Theme.colors.textMuted }}
          className="mt-2 text-xs"
        >
          EMI starting from ₹{emi}/month
        </p>
      </div>
    </div>
  );
});

export default function ProductSections() {
  return (
    <section
      style={{ backgroundColor: Theme.colors.background }}
      className="py-8 w-full"
    >
      <div className="px-4 md:px-6 lg:px-8 mx-auto">
        <h2
          style={{ color: Theme.colors.text }}
          className="text-2xl font-bold mb-6"
        >
          Product Sections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {dummyProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}