export const formatProduct = (product) => {
  const price = Number(product.price) || 0;
  const discount = Number(product.discount) || 0;

  const finalPrice = price - (price * discount) / 100;

  return {
    id: product._id.toString(),
    name: product.name,
    price,
    discount,
    finalPrice,
    unit: product.unit,
    stock: product.stock,
    description: product.description,
    image: product.image?.[0] || null,
  };
};
