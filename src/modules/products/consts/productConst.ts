const productConst = {
  route: {
    productPage: "/shop",
    productDetailsPage: "/product/:id",
  },

  /** Shared by the header category selector and the listing filter bar. */
  categories: [
    { value: "all", label: "All Categories", short: "All" },
    { value: "paper-craft", label: "Paper & Craft", short: "Paper & Craft" },
    { value: "home-decor", label: "Home Decor", short: "Home Decor" },
    { value: "lighting", label: "Lighting", short: "Lighting" },
    { value: "clocks", label: "Clocks", short: "Clocks" },
  ],

  sortOptions: [
    { value: "featured", label: "Featured" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "rating", label: "Top Rated" },
  ],
};
export default productConst;